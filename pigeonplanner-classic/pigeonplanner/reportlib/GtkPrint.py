#
# Gramps - a GTK+/GNOME based genealogy program
#
# Copyright (C) 2007       Zsolt Foldvari
# Copyright (C) 2008-2009  Brian G. Matherly
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#

# $Id: GtkPrint.py 18556 2011-12-08 16:40:27Z paul-franklin $

"""Printing interface based on gtk.Print* classes.
"""

#------------------------------------------------------------------------
#
# Python modules
#
#------------------------------------------------------------------------
from gettext import gettext as _

##try:
    ##from cStringIO import StringIO
##except:
    ##from StringIO import StringIO

#------------------------------------------------------------------------
#
# Gramps modules
#
#------------------------------------------------------------------------
import libcairodoc
from .styles.paperstyle import PAPER_PORTRAIT
from .gui.printpreview import PrintPreview

#------------------------------------------------------------------------
#
# Set up logging
#
#------------------------------------------------------------------------
import logging
log = logging.getLogger(".GtkPrint")

#-------------------------------------------------------------------------
#
# GTK modules
#
#-------------------------------------------------------------------------
import cairo
try: # the Gramps-Connect server has no DISPLAY
    import gtk
    if gtk.pygtk_version < (2, 10, 0):
        raise SystemExit(_("PyGtk 2.10 or later is required"))
    import gobject
except:
    pass

#------------------------------------------------------------------------
#
# Constants
#
#------------------------------------------------------------------------

# printer settings (might be needed to align for different platforms)
PRINTER_DPI = 72.0
PRINTER_SCALE = 1.0

# the print settings to remember between print sessions
PRINT_SETTINGS = None

# minimum spacing around a page in print preview
MARGIN = 6

# zoom modes in print preview
(ZOOM_BEST_FIT,
 ZOOM_FIT_WIDTH,
 ZOOM_FREE,) = range(3)

# Print actions
PRINT_ACTION_DIALOG = gtk.PRINT_OPERATION_ACTION_PRINT_DIALOG
PRINT_ACTION_PRINT = gtk.PRINT_OPERATION_ACTION_PRINT
PRINT_ACTION_PREVIEW = gtk.PRINT_OPERATION_ACTION_PREVIEW
PRINT_ACTION_EXPORT = gtk.PRINT_OPERATION_ACTION_EXPORT
 
#------------------------------------------------------------------------
#
# Converter functions
#
#------------------------------------------------------------------------

def paperstyle_to_pagesetup(paper_style):
    """Convert a PaperStyle instance into a gtk.PageSetup instance.
    
    @param paper_style: Gramps paper style object to convert
    @param type: PaperStyle
    @return: page_setup
    @rtype: gtk.PageSetup
    """
    # paper size names according to 'PWG Candidate Standard 5101.1-2002'
    # ftp://ftp.pwg.org/pub/pwg/candidates/cs-pwgmsn10-20020226-5101.1.pdf
    gramps_to_gtk = {
        "Letter": "na_letter",
        "Legal": "na_legal",
        "A0": "iso_a0",
        "A1": "iso_a1",
        "A2": "iso_a2",
        "A3": "iso_a3",
        "A4": "iso_a4",
        "A5": "iso_a5",
        "B0": "iso_b0",
        "B1": "iso_b1",
        "B2": "iso_b2",
        "B3": "iso_b3",
        "B4": "iso_b4",
        "B5": "iso_b5",
        "B6": "iso_b6",
        "B": "na_ledger",
        "C": "na_c",
        "D": "na_d",
        "E": "na_e",
    }

    # First set the paper size
    gramps_paper_size = paper_style.get_size()
    gramps_paper_name = gramps_paper_size.get_name()
    
    # All sizes not included in the translation table (even if a standard size)
    # are handled as custom format, because we are not intelligent enough.
    if gramps_paper_name in gramps_to_gtk:
        paper_size = gtk.PaperSize(gramps_to_gtk[gramps_paper_name])
        log.debug("Selected paper size: %s" % gramps_to_gtk[gramps_paper_name])
    else:
        if paper_style.get_orientation() == PAPER_PORTRAIT:
            paper_width = gramps_paper_size.get_width() * 10
            paper_height = gramps_paper_size.get_height() * 10
        else:
            paper_width = gramps_paper_size.get_height() * 10
            paper_height = gramps_paper_size.get_width() * 10
        paper_size = gtk.paper_size_new_custom("custom",
                                               "Custom Size",
                                               paper_width,
                                               paper_height,
                                               gtk.UNIT_MM)
        log.debug("Selected paper size: (%f,%f)" % (paper_width, paper_height))
        
    page_setup = gtk.PageSetup()
    page_setup.set_paper_size(paper_size)
    
    # Set paper orientation
    if paper_style.get_orientation() == PAPER_PORTRAIT:
        page_setup.set_orientation(gtk.PAGE_ORIENTATION_PORTRAIT)
    else:
        page_setup.set_orientation(gtk.PAGE_ORIENTATION_LANDSCAPE)

    # Set paper margins
    page_setup.set_top_margin(paper_style.get_top_margin() * 10,
                              gtk.UNIT_MM)
    page_setup.set_bottom_margin(paper_style.get_bottom_margin() * 10,
                                 gtk.UNIT_MM)
    page_setup.set_left_margin(paper_style.get_left_margin() * 10,
                               gtk.UNIT_MM)
    page_setup.set_right_margin(paper_style.get_right_margin() * 10,
                                gtk.UNIT_MM)
    
    return page_setup
    
#------------------------------------------------------------------------
#
# GtkPrint class
#
#------------------------------------------------------------------------
class GtkPrint(libcairodoc.CairoDoc):
    """Print document via GtkPrint* interface.
    
    Requires Gtk+ 2.10.
    
    """
    def run(self, print_action):
        """Run the Gtk Print operation.
        """
        global PRINT_SETTINGS

        # get a page setup from the paper style we have
        page_setup = paperstyle_to_pagesetup(self.paper)
        
        # set up a print operation
        operation = gtk.PrintOperation()
        operation.set_default_page_setup(page_setup)
        operation.connect("begin_print", self.on_begin_print)
        operation.connect("draw_page", self.on_draw_page)
        operation.connect("paginate", self.on_paginate)
        operation.connect("preview", self.on_preview)

        # set print settings if it was stored previously
        if PRINT_SETTINGS is not None:
            operation.set_print_settings(PRINT_SETTINGS)

        # run print dialog
        while True:
            self.preview = None
            try:
                res = operation.run(print_action, self._parent)
            except gobject.GError:
                # Windows only. Rare case where the user clicks cancel in the
                # dialog to choose a filename for printing to a file.
                res = None
            if self.preview is None or print_action != PRINT_ACTION_DIALOG:
                # cancel, print or non-printing action
                break
            # set up printing again; can't reuse PrintOperation?
            operation = gtk.PrintOperation()
            operation.set_default_page_setup(page_setup)
            operation.connect("begin_print", self.on_begin_print)
            operation.connect("draw_page", self.on_draw_page)
            operation.connect("paginate", self.on_paginate)
            operation.connect("preview", self.on_preview)
            # set print settings if it was stored previously
            if PRINT_SETTINGS is not None:
                operation.set_print_settings(PRINT_SETTINGS)
        
        # store print settings if printing was successful
        if res == gtk.PRINT_OPERATION_RESULT_APPLY:
            PRINT_SETTINGS = operation.get_print_settings()

    def on_begin_print(self, operation, context):
        """Setup environment for printing.
        """
        # get data from context here only once to save time on pagination
        self.page_width = round(context.get_width())
        self.page_height = round(context.get_height())
        self.dpi_x = context.get_dpi_x()
        self.dpi_y = context.get_dpi_y()
        
    def on_paginate(self, operation, context):
        """Paginate the whole document in chunks.
        """
        layout = context.create_pango_layout()

        finished = self.paginate(layout,
                                 self.page_width,
                                 self.page_height,
                                 self.dpi_x,
                                 self.dpi_y)
        # update page number
        operation.set_n_pages(len(self._pages))
        
        # start preview if needed
        if finished and self.preview:
            self.preview.start()
            
        return finished

    def on_draw_page(self, operation, context, page_nr):
        """Draw the requested page.
        """
        cr = context.get_cairo_context()
        layout = context.create_pango_layout()
        width = round(context.get_width())
        height = round(context.get_height())
        dpi_x = context.get_dpi_x()
        dpi_y = context.get_dpi_y()

        self.draw_page(page_nr, cr, layout, width, height, dpi_x, dpi_y)
        
    def on_preview(self, operation, preview, context, parent):
        """Implement custom print preview functionality.
        """
        ##if constfunc.win()':
            ##return False
            
        self.preview = PrintPreview(operation, preview, context, parent)
        
        # give a dummy cairo context to gtk.PrintContext,
        # PrintPreview will update it with the real one
        try:
            width = int(round(context.get_width()))
        except ValueError:
            width = 0
        try:
            height = int(round(context.get_height()))
        except ValueError:
            height = 0
        surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, height)
        cr = cairo.Context(surface)
        context.set_cairo_context(cr, PRINTER_DPI, PRINTER_DPI)
        
        return True
