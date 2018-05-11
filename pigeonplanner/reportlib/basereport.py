#
# Gramps - a GTK+/GNOME based genealogy program
#
# Copyright (C) 2001  David R. Hampton
# Copyright (C) 2001-2006  Donald N. Allingham
# Copyright (C) 2007       Brian G. Matherly
# Copyright (C) 2010       Jakim Friant
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

# $Id: _reportbase.py 18378 2011-10-29 05:02:33Z pez4brian $


from .PdfDoc import PdfDoc
from .GtkPrint import GtkPrint, PRINT_ACTION_DIALOG, PRINT_ACTION_EXPORT
from .styles import StyleSheet, PaperStyle, PaperSize, PAPER_PORTRAIT


class Report(object):
    """
    The Report base class.  This is a base class for generating
    customized reports.  It cannot be used as is, but it can be easily
    sub-classed to create a functional report generator.
    """

    def __init__(self, name, reportopts):
        reportopts.set_values()
        self._reportopts = reportopts

        #TODO: Improve this!
        #      Defined in gen.plug.report._paper
        if reportopts.paper == "A4":
            h, w = 29.7, 21.0
        elif reportopts.paper == "Letter":
            h, w = 27.94, 21.59
        else:
            raise ValueError("Paper must either be A4 or Letter")
        paper_size = PaperSize(reportopts.paper, h, w)
        paper_style = PaperStyle(paper_size, reportopts.orientation,
                                 **reportopts.margins)
        style_sheet = StyleSheet()
        reportopts.make_default_style(style_sheet)

        if reportopts.filename is None:
            reportopts.filename = name

        if reportopts.print_action == PRINT_ACTION_EXPORT:
            docgenclass = PdfDoc
        else:
            docgenclass = GtkPrint
        self.doc = docgenclass(style_sheet, paper_style)
        self.doc.open(reportopts.filename, reportopts.parent)

    def begin_report(self):
        pass

    def write_report(self):
        pass

    def end_report(self):
        self.doc.close(self._reportopts.print_action)


class ReportOptions(object):
    def __init__(self, paper="A4", orientation=PAPER_PORTRAIT,
                       print_action=PRINT_ACTION_DIALOG, filename=None,
                       margins={}, parent=None):
        self.paper = paper
        self.orientation = orientation
        self.print_action = print_action
        self.filename = filename
        self.margins = margins
        self.parent = parent

    def set_values(self):
        """ Override to change attributes from within the report.
        """

    def make_default_style(self, default_style):
        pass


def report(reportclass, reportopts, *args):
    myreport = reportclass(reportopts, *args)
    myreport.begin_report()
    myreport.write_report()
    myreport.end_report()
