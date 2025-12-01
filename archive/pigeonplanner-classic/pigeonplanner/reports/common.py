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


class HelperMethods(object):
    def add_header(self):
        """
        Add a header with user info to the report.

        Note: this method assumes there is a self._userinfo
        """
        self.doc.start_paragraph("header")
        if config.get("printing.user-name"):
            self.doc.write_text(self._userinfo["name"] + "\n")
        if config.get("printing.user-address"):
            self.doc.write_text(self._userinfo["street"] + "\n")
            self.doc.write_text("%s %s\n" % (self._userinfo["code"],
                                             self._userinfo["city"]))
        if config.get("printing.user-phone"):
            self.doc.write_text(self._userinfo["phone"] + "\n")
        if config.get("printing.user-email"):
            self.doc.write_text(self._userinfo["email"])
        self.doc.end_paragraph()

    def add_cell(self, text, cellstyle, parastyle, span=1):
        """
        Add a cell to the report with given text and cell/paragraph styles.
        """
        self.doc.start_cell(cellstyle, span=span)
        self.doc.start_paragraph(parastyle)
        self.doc.write_text(text)
        self.doc.end_paragraph()
        self.doc.end_cell()
