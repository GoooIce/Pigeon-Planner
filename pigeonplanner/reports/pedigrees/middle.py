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
from pigeonplanner.core import pigeon as corepigeon
from pigeonplanner.reportlib.basereport import Report, ReportOptions
from pigeonplanner.reportlib.styles import (ParagraphStyle, FontStyle,
                                            GraphicsStyle, FONT_SANS_SERIF,
                                            PAPER_LANDSCAPE)


class PedigreeReport(Report):
    def __init__(self, reportopts, pigeon, userinfo):
        Report.__init__(self, "My_pedigree", reportopts)

        self._pigeon = pigeon
        self._userinfo = userinfo

    def write_report(self):
        self.doc.start_page()

        w_center = self.doc.get_usable_width() / 2.
        h_center = self.doc.get_usable_height() / 2.

        # Header
        band = self._pigeon.get_band_string(True) if self._pigeon is not None else ""
        title = _("Pedigree of:") + ("   %s" % band)
        self.doc.center_text("Title", title, w_center, 0)
        self.doc.draw_line("Seperator", 0, 1, self.doc.get_usable_width(), 1)

        # User info
        userinfo = []
        if config.get("printing.user-name"):
            userinfo.append(self._userinfo["name"])
        if config.get("printing.user-address"):
            userinfo.append(self._userinfo["street"])
            userinfo.append("%s %s" % (self._userinfo["code"], self._userinfo["city"]))
        if config.get("printing.user-phone"):
            userinfo.append(self._userinfo["phone"])
        if config.get("printing.user-email"):
            userinfo.append(self._userinfo["email"])

        header_y = self.doc.get_usable_height() - 3
        self.doc.center_text("User", "\n".join(userinfo), w_center, header_y)

        if config.get("printing.pedigree-image") and self._pigeon is not None and\
                                self._pigeon.image:
            img_x = w_center
            img_y = 2
            img_w = 7
            img_h = 4

            self.doc.draw_image(self._pigeon.image, img_x, img_y, img_w, img_h,
                                xalign="center", yalign="top")

        # Pedigree
        lst = [None]*31
        corepigeon.build_pedigree_tree(self._pigeon, 0, 1, lst)

        h_sep = .2
        w_sep = .2
        w = (self.doc.get_usable_width() / 5) - (w_sep * 3)
        h = 3.1

        x_0 = w_center - (w / 2.)
        x_left_1 = w_center - w - w / 2. - w_sep * 2
        x_left_2 = w_center - w - w / 1.6 - w_sep * 2
        x_left_3 = w_center - w * 2. - w / 1.6 - w_sep * 4
        x_right_1 = w_center - (w / 2.) + w + w_sep * 2
        x_right_2 = w_center + w / 1.6 + w_sep * 2
        x_right_3 = w_center + w + w / 1.6 + w_sep * 4

        y_1 = h_center - h * 2. - h_sep * 5
        y_2 = h_center - h - h / 2. - h_sep * 4
        y_3 = h_center - h - h_sep * 3
        y_4 = h_center - (h / 2.)
        y_5 = h_center + h_sep * 3
        y_6 = h_center + h / 2. + h_sep * 4
        y_7 = h_center + h + h_sep * 5

        posmap = {0: {"x": x_0, "y": y_4},
                  1: {"x": x_left_1, "y": y_4},
                  2: {"x": x_right_1, "y": y_4},
                  3: {"x": x_left_2, "y": y_2},
                  4: {"x": x_left_2, "y": y_6},
                  5: {"x": x_right_2, "y": y_2},
                  6: {"x": x_right_2, "y": y_6},
                  7: {"x": x_left_3, "y": y_1},
                  8: {"x": x_left_3, "y": y_3},
                  9: {"x": x_left_3, "y": y_5},
                  10: {"x": x_left_3, "y": y_7},
                  11: {"x": x_right_3, "y": y_1},
                  12: {"x": x_right_3, "y": y_3},
                  13: {"x": x_right_3, "y": y_5},
                  14: {"x": x_right_3, "y": y_7},
            }

        for index, pigeon in enumerate(lst):
            try:
                x = posmap[index]["x"]
                y = posmap[index]["y"]
            except KeyError:
                break

            # Get the text
            if pigeon is not None:
                text = [pigeon.get_band_string(True)]
                ex1, ex2, ex3, ex4, ex5, ex6 = pigeon.get_extra()
                if config.get("printing.pedigree-box-colour"):
                    text.append(pigeon.get_colour())
            else:
                text = [""]
                ex1, ex2, ex3, ex4, ex5, ex6 = ("", "", "", "", "", "")

            for ex in ex1, ex2, ex3, ex4, ex5, ex6:
                text.append(ex)

            self.doc.draw_box("Pedigree", "\n".join(text), x, y, w, h)

        # Pedigree lines
        # Box 0 to 1 and 2
        y = y_4 + h / 2.
        self.doc.draw_line("PedigreeLine", x_0, y, x_0 - w_sep * 2, y)
        self.doc.draw_line("PedigreeLine", x_0 + w, y, x_0 + w + w_sep * 2, y)
        # Box 1 to 3 and 4
        x = x_left_1 + w / 2.
        self.doc.draw_line("PedigreeLine", x, y_4, x, y_2 + h)
        self.doc.draw_line("PedigreeLine", x, y_4 + h, x, y_6)
        # Box 2 to 5 and 6
        x = x_right_1 + w / 2.
        self.doc.draw_line("PedigreeLine", x, y_4, x, y_2 + h)
        self.doc.draw_line("PedigreeLine", x, y_4 + h, x, y_6)
        # Box 3 to 7 and 8
        y = y_2 + h / 2.
        self.doc.draw_line("PedigreeLine", x_left_2, y, x_left_2 - w_sep, y)
        x = x_left_3 + w
        y1 = y_1 + h / 2.
        self.doc.draw_line("PedigreeLine", x, y1, x + w_sep, y1)
        y2 = y_3 + h / 2.
        self.doc.draw_line("PedigreeLine", x, y2, x + w_sep, y2)
        self.doc.draw_line("PedigreeLine", x + w_sep, y1, x + w_sep, y2)
        # Box 4 to 9 and 10
        y = y_6 + h / 2.
        self.doc.draw_line("PedigreeLine", x_left_2, y, x_left_2 - w_sep, y)
        x = x_left_3 + w
        y1 = y_5 + h / 2.
        self.doc.draw_line("PedigreeLine", x, y1, x + w_sep, y1)
        y2 = y_7 + h / 2.
        self.doc.draw_line("PedigreeLine", x, y2, x + w_sep, y2)
        self.doc.draw_line("PedigreeLine", x + w_sep, y1, x + w_sep, y2)
        # Box 5 to 11 and 12
        y = y_2 + h / 2.
        self.doc.draw_line("PedigreeLine", x_right_2 + w, y, x_right_2 + w + w_sep, y)
        x = x_right_3
        y1 = y_1 + h / 2.
        self.doc.draw_line("PedigreeLine", x, y1, x - w_sep, y1)
        y2 = y_3 + h / 2.
        self.doc.draw_line("PedigreeLine", x, y2, x - w_sep, y2)
        self.doc.draw_line("PedigreeLine", x - w_sep, y1, x - w_sep, y2)
        # Box 6 to 13 and 14
        y = y_6 + h / 2.
        self.doc.draw_line("PedigreeLine", x_right_2 + w, y, x_right_2 + w + w_sep, y)
        x = x_right_3
        y1 = y_5 + h / 2.
        self.doc.draw_line("PedigreeLine", x, y1, x - w_sep, y1)
        y2 = y_7 + h / 2.
        self.doc.draw_line("PedigreeLine", x, y2, x - w_sep, y2)
        self.doc.draw_line("PedigreeLine", x - w_sep, y1, x - w_sep, y2)

        self.doc.end_page()


class PedigreeReportOptions(ReportOptions):

    def set_values(self):
        self.margins = {"lmargin": .5, "rmargin": .5,
                        "tmargin": 1., "bmargin": 1.}
        self.orientation = PAPER_LANDSCAPE

    def make_default_style(self, default_style):
        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=18)
        para = ParagraphStyle()
        para.set(font=font)
        default_style.add_paragraph_style("Title", para)
        g = GraphicsStyle()
        g.set_paragraph_style("Title")
        default_style.add_draw_style("Title", g)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=10)
        para = ParagraphStyle()
        para.set(font=font)
        default_style.add_paragraph_style("User", para)
        g = GraphicsStyle()
        g.set_paragraph_style("User")
        default_style.add_draw_style("User", g)

        font = FontStyle()
        font.set(face=FONT_SANS_SERIF, size=8)
        para = ParagraphStyle()
        para.set(font=font)
        default_style.add_paragraph_style("Pedigree", para)
        g = GraphicsStyle()
        g.set_line_width(1)
        g.set_paragraph_style("Pedigree")
        default_style.add_draw_style("Pedigree", g)

        g = GraphicsStyle()
        g.set_line_width(.6)
        default_style.add_draw_style("PedigreeLine", g)

        g = GraphicsStyle()
        g.set_line_width(1)
        default_style.add_draw_style("Seperator", g)

