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


from pigeonplanner.reportlib.basereport import Report, ReportOptions
from pigeonplanner.reportlib.styles import (ParagraphStyle, FontStyle,
                                            TableStyle, TableCellStyle,
                                            FONT_SANS_SERIF, PARA_ALIGN_LEFT,
                                            PARA_ALIGN_CENTER)


class VelocityReport(Report):
    def __init__(self, reportopts, data, info):
        Report.__init__(self, "Velocity", reportopts)

        self.data = data
        self.info = info

    def write_report(self):
        self.doc.start_paragraph("header")
        self.doc.write_text(_("Velocity"))
        self.doc.end_paragraph()

        self.doc.start_paragraph("info")
        self.doc.write_text("%s: %s\n" % (_("Date"), self.info[0]))
        self.doc.write_text("%s: %s\n" % (_("Released"), self.info[1]))
        self.doc.write_text("%s: %s" % (_("Distance"), str(self.info[2])))
        self.doc.end_paragraph()

        self.doc.start_table("my_table", "table")
        self.doc.start_row()
        self._add_cell(_("Velocity"), "headercell", "colheader")
        self._add_cell(_("Flight Time"), "headercell", "colheader")
        self._add_cell(_("Time of Arrival"), "headercell", "colheader")
        self.doc.end_row()
        for row in self.data:
            self.doc.start_row()
            for col in row:
                self._add_cell(str(col), "cell", "celltext")
            self.doc.end_row()
        self.doc.end_table()

    def _add_cell(self, text, cellstyle, parastyle, span=1):
        self.doc.start_cell(cellstyle, span=span)
        self.doc.start_paragraph(parastyle)
        self.doc.write_text(text)
        self.doc.end_paragraph()
        self.doc.end_cell()


class VelocityReportOptions(ReportOptions):

    def make_default_style(self, default_style):
        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=22)
        para = ParagraphStyle()
        para.set(font=font, align=PARA_ALIGN_CENTER, bborder=1, bmargin=.5)
        default_style.add_paragraph_style("header", para)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=14)
        para = ParagraphStyle()
        para.set(font=font, align=PARA_ALIGN_LEFT, bborder=1, bmargin=.5)
        default_style.add_paragraph_style("info", para)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=14, bold=1)
        para = ParagraphStyle()
        para.set(font=font, align=PARA_ALIGN_CENTER)
        default_style.add_paragraph_style("colheader", para)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=14)
        para = ParagraphStyle()
        para.set(font=font, align=PARA_ALIGN_CENTER)
        default_style.add_paragraph_style("celltext", para)

        table = TableStyle()
        table.set_width(100)
        table.set_column_widths([30, 35, 35])
        default_style.add_table_style("table", table)

        cell = TableCellStyle()
        cell.set_padding(0.1)
        cell.set_borders(0, 1, 0, 0)
        default_style.add_cell_style("headercell", cell)

        cell = TableCellStyle()
        cell.set_padding(0.1)
        cell.set_borders(0, 0, 0, 0)
        default_style.add_cell_style("cell", cell)

