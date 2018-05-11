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


import gtk


class _MessageDialog(gtk.MessageDialog):
    def __init__(self, parent, msg, msgtype, buttons, extra):
        gtk.MessageDialog.__init__(self, parent,
                                   flags=gtk.DIALOG_MODAL,
                                   type=msgtype)

        head, secondary, title = msg
        if extra:
            head = head % extra
        self.set_markup("<span weight=\"bold\" size=\"larger\">%s</span>" % head)
        self.format_secondary_text(secondary)
        if title:
            self.set_title("%s - Pigeon Planner" % title)
        self.add_buttons(*buttons)


class ErrorDialog(_MessageDialog):
    def __init__(self, msg, parent=None, extra=None):
        _MessageDialog.__init__(self, parent, msg, gtk.MESSAGE_ERROR,
                                (gtk.STOCK_OK, gtk.RESPONSE_OK), extra)
        self.run()
        self.destroy()


class InfoDialog(_MessageDialog):
    def __init__(self, msg, parent=None, extra=None):
        _MessageDialog.__init__(self, parent, msg, gtk.MESSAGE_INFO,
                                (gtk.STOCK_OK, gtk.RESPONSE_OK), extra)
        self.run()
        self.destroy()


class WarningDialog(_MessageDialog):
    def __init__(self, msg, parent=None, extra=None):
        _MessageDialog.__init__(self, parent, msg, gtk.MESSAGE_WARNING,
                                (gtk.STOCK_NO, gtk.RESPONSE_NO,
                                 gtk.STOCK_YES, gtk.RESPONSE_YES), extra)

    def run(self):
        response = _MessageDialog.run(self)
        self.destroy()
        return response == gtk.RESPONSE_YES


class QuestionDialog(_MessageDialog):
    def __init__(self, msg, parent=None, extra=None):
        _MessageDialog.__init__(self, parent, msg, gtk.MESSAGE_QUESTION,
                                (gtk.STOCK_NO, gtk.RESPONSE_NO,
                                 gtk.STOCK_YES, gtk.RESPONSE_YES), extra)

    def run(self):
        response = _MessageDialog.run(self)
        self.destroy()
        return response == gtk.RESPONSE_YES

