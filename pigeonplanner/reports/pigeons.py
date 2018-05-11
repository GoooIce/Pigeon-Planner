# -*- coding: utf-8 -*-

# This file is part of Pigeon Planner.

# Pigeon Planner is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Pigeon Planner is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Pigeon Planner.  If not, see <http://www.gnu.org/licenses/>


from pigeonplanner.core import config
from pigeonplanner.reports.common import HelperMethods
from pigeonplanner.reportlib.basereport import Report, ReportOptions
from pigeonplanner.reportlib.styles import (ParagraphStyle, FontStyle,
                                            TableStyle, TableCellStyle,
                                            FONT_SANS_SERIF, PARA_ALIGN_LEFT)


class PigeonsReport(Report, HelperMethods):
    def __init__(self, reportopts, pigeons, userinfo):
        Report.__init__(self, "My_pigeons", reportopts)

        self._pigeons = pigeons
        self._userinfo = userinfo

    def write_report(self):
        # Header with user details
        self.add_header()

        # Pigeon table
        #TODO: column size with different columns
        columns = [(_("Band no."), "get_band_string")]

        if config.get("columns.pigeon-sex") or config.get("printing.pigeon-sex"):
            columns.append((_("Sex"), "get_sex_string"))
        if config.get("columns.pigeon-name"):
            columns.append((_("Name"), "get_name"))
        if config.get("columns.pigeon-colour"):
            columns.append((_("Colour"), "get_colour"))
        if config.get("columns.pigeon-loft"):
            columns.append((_("Loft"), "get_loft"))
        if config.get("columns.pigeon-strain"):
            columns.append((_("Strain"), "get_strain"))
        if config.get("columns.pigeon-status"):
            columns.append((_("Status"), "get_status"))

        self.doc.start_table("my_table", "table")

        if config.get("printing.pigeon-colnames"):
            self.doc.start_row()
            for name, method in columns:
                self.add_cell(name, "headercell", "colheader")
            self.doc.end_row()

        for pigeon in self._pigeons:
            self.doc.start_row()
            for name, method in columns:
                self.add_cell(getattr(pigeon, method)(), "cell", "celltext")
            self.doc.end_row()
        self.doc.end_table()


class PigeonsReportOptions(ReportOptions):

    def make_default_style(self, default_style):
        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=12)
        para = ParagraphStyle()
        para.set(font=font, align=PARA_ALIGN_LEFT, bborder=1, bmargin=.5)
        default_style.add_paragraph_style("header", para)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=10, bold=1)
        para = ParagraphStyle()
        para.set(font=font)
        default_style.add_paragraph_style("colheader", para)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=10)
        para = ParagraphStyle()
        para.set(font=font)
        default_style.add_paragraph_style("celltext", para)

        table = TableStyle()
        table.set_width(100)
        table.set_column_widths([20, 15, 15, 10, 15, 15, 10])
        default_style.add_table_style("table", table)

        cell = TableCellStyle()
        cell.set_padding(0.1)
        cell.set_borders(0, 1, 0, 0)
        default_style.add_cell_style("headercell", cell)

        cell = TableCellStyle()
        cell.set_padding(0.1)
        cell.set_borders(0, 0, 0, 0)
        default_style.add_cell_style("cell", cell)
