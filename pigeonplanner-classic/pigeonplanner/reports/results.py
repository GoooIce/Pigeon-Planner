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
                                            FONT_SANS_SERIF, PAPER_LANDSCAPE,
                                            PARA_ALIGN_LEFT)


columnsize = {"date": 7,
              "point": 12,
              "ring": 8,
              "placestr": 5,
              "out": 5,
              "type": 6,
              "wind": 6.5,
              "weather": 6.5,
              "coefstr": 6,
              "sector": 10,
              "category": 7,
              "comment": 21
        }


class ResultsReport(Report, HelperMethods):
    def __init__(self, reportopts, data, userinfo):
        Report.__init__(self, "My results", reportopts)

        self._data = data
        self._userinfo = userinfo

    def write_report(self):
        # Header with user details
        self.add_header()

        # Pagenumber and date
        #TODO: how to get pagenr and total pages at this point?
#        self.doc.start_paragraph("pagenr")
#        self.doc.write_text("")
#        self.doc.end_paragraph()

        # Actual results
        self.headermap = {"date": _("Date"),
                          "point": _("Racepoint"),
                          "ring": _("Band no."),
                          "placestr": _("Placed"),
                          "out": _("Out of"),
                          "type": _("Type"),
                          "wind": _("Wind"),
                          "weather": _("Weather"),
                          "coefstr": _("Coef."),
                          "sector": _("Sector"),
                          "category": _("Category"),
                          "comment": _("Comment")
                }

        if config.get("interface.results-mode") == 0:
            self._do_report_classic()
        elif config.get("interface.results-mode") == 1:
            self._do_report_splitted()

    def _add_table_style(self, columns):
        if sum(columns) != 100:
            # If some columns are disabled, split those widths along the other columns
            remaining = 100 - sum(columns)
            foreach = remaining / len(columns)
            columns = [val + foreach for val in columns]

        style_sheet = self.doc.get_style_sheet()
        table = TableStyle()
        table.set_width(100)
        table.set_column_widths(columns)
        style_sheet.add_table_style("table", table)
        self.doc.set_style_sheet(style_sheet)

    def _do_report_classic(self):
        columns = ["ring", "date", "point", "placestr", "out"]
        if config.get("columns.result-coef"):
            columns.append("coefstr")
        if config.get("columns.result-sector"):
            columns.append("sector")
        if config.get("columns.result-type"):
            columns.append("type")
        if config.get("columns.result-category"):
            columns.append("category")
        if config.get("columns.result-weather"):
            columns.append("wind")
        if config.get("columns.result-wind"):
            columns.append("weather")
        if config.get("columns.result-comment"):
            columns.append("comment")

        self._add_table_style([columnsize[col] for col in columns])
        self.doc.start_table("my_table", "table")

        if config.get("printing.result-colnames"):
            self.doc.start_row()
            for name in columns:
                self.add_cell(self.headermap[name], "headercell", "colheader")
            self.doc.end_row()

        # data = [{}]
        for item in self._data:
            self.doc.start_row()
            for name in columns:
                self.add_cell(str(item[name]), "cell", "celltext")
            self.doc.end_row()
        self.doc.end_table()

    def _do_report_splitted(self):
        racecolumns = ["date", "point"]
        if config.get("columns.result-type"):
            racecolumns.append("type")
        if config.get("columns.result-weather"):
            racecolumns.append("wind")
        if config.get("columns.result-wind"):
            racecolumns.append("weather")
        resultcolumns = ["ring", "placestr", "out"]
        if config.get("columns.result-coef"):
            resultcolumns.append("coefstr")
        if config.get("columns.result-sector"):
            resultcolumns.append("sector")
        if config.get("columns.result-category"):
            resultcolumns.append("category")
        if config.get("columns.result-comment"):
            resultcolumns.append("comment")

        columns = racecolumns + resultcolumns
        dummyrace = {"date": "",
                     "point": "",
                     "type": "",
                     "wind": "",
                     "weather": ""}

        self._add_table_style([columnsize[col] for col in columns])
        self.doc.start_table("my_table", "table")

        if config.get("printing.result-colnames"):
            self.doc.start_row()
            for name in columns:
                self.add_cell(self.headermap[name], "headercell", "colheader")
            self.doc.end_row()

        # data = [{"race": {}, "results": [{}, {}]}]
        for item in self._data:
            self.doc.start_row()
            for name in racecolumns:
                value = item["race"][name]
                self.add_cell(str(value), "cell", "celltext")
            for name in resultcolumns:
                value = item["results"][0][name]
                self.add_cell(str(value), "cell", "celltext")
            self.doc.end_row()

            for result in item["results"][1:]:
                self.doc.start_row()
                for name in racecolumns:
                    value = dummyrace[name]
                    self.add_cell(str(value), "cell", "celltext")
                for name in resultcolumns:
                    value = result[name]
                    self.add_cell(str(value), "cell", "celltext")
                self.doc.end_row()

        self.doc.end_table()


class ResultsReportOptions(ReportOptions):

    def set_values(self):
        self.orientation = PAPER_LANDSCAPE
        self.margins = {"lmargin": 1., "rmargin": 1.,
                        "tmargin": 1., "bmargin": 1.}

    def make_default_style(self, default_style):
        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=12)
        para = ParagraphStyle()
        para.set(font=font, align=PARA_ALIGN_LEFT, bborder=1, bmargin=.5)
        default_style.add_paragraph_style("header", para)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=6)
        para = ParagraphStyle()
        para.set(font=font)
        default_style.add_paragraph_style("pagenr", para)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=8, bold=1)
        para = ParagraphStyle()
        para.set(font=font)
        default_style.add_paragraph_style("colheader", para)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=7)
        para = ParagraphStyle()
        para.set(font=font)
        default_style.add_paragraph_style("celltext", para)

        cell = TableCellStyle()
        cell.set_padding(0.1)
        cell.set_borders(0, 1, 0, 0)
        default_style.add_cell_style("headercell", cell)

        cell = TableCellStyle()
        cell.set_padding(0.1)
        cell.set_borders(0, 0, 0, 0)
        default_style.add_cell_style("cell", cell)
