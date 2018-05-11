#
# Gramps - a GTK+/GNOME based genealogy program
#
# Copyright (C) 2000-2007  Donald N. Allingham
# Copyright (C) 2002       Gary Shao
# Copyright (C) 2007       Brian G. Matherly
# Copyright (C) 2009       Benny Malengier
# Copyright (C) 2009       Gary Burton
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

# $Id: drawdoc.py 18338 2011-10-16 20:21:22Z paul-franklin $


#-------------------------------------------------------------------------
#
# standard python modules
#
#-------------------------------------------------------------------------

#-------------------------------------------------------------------------
#
# GRAMPS modules
#
#-------------------------------------------------------------------------
import fontscale

#-------------------------------------------------------------------------
#
# set up logging
#
#-------------------------------------------------------------------------
import logging
log = logging.getLogger(".drawdoc")

#------------------------------------------------------------------------
#
# DrawDoc
#
#------------------------------------------------------------------------
class DrawDoc(object):
    """
    Abstract Interface for graphical document generators. Output formats
    for graphical reports must implement this interface to be used by the
    report system.
    """

    def start_page(self):
        raise NotImplementedError

    def end_page(self):
        raise NotImplementedError

    def get_usable_width(self):
        """
        Return the width of the text area in centimeters. The value is
        the page width less the margins.
        """
        width = self.paper.get_size().get_width()
        right = self.paper.get_right_margin()
        left = self.paper.get_left_margin()
        return width - (right + left)

    def get_usable_height(self):
        """
        Return the height of the text area in centimeters. The value is
        the page height less the margins.
        """
        height = self.paper.get_size().get_height()
        top = self.paper.get_top_margin()
        bottom = self.paper.get_bottom_margin()
        return height - (top + bottom)

    def string_width(self, fontstyle, text):
        "Determine the width need for text in given font"
        return fontscale.string_width(fontstyle, text)

    def draw_path(self, style, path):
        raise NotImplementedError
    
    def draw_box(self, style, text, x, y, w, h):
        raise NotImplementedError

    def draw_text(self, style, text, x1, y1):
        raise NotImplementedError

    def center_text(self, style, text, x1, y1):
        raise NotImplementedError

    def rotate_text(self, style, text, x, y, angle):
        raise NotImplementedError
    
    def draw_line(self, style, x1, y1, x2, y2):
        raise NotImplementedError
