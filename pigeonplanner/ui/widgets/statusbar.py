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
import gobject

from pigeonplanner.ui import component


class _TotalLabel(gtk.Label):
    __gtype_name__ = "_TotalLabel"
    TEMPLATE = _("Pigeons: %s")
    def __init__(self):
        gtk.Label.__init__(self)
        self._value = None

    def get_value(self):
        return self._value

    def set_value(self, value):
        self._value = value
        self.set_text(self.TEMPLATE % value)


class _FilterLabel(gtk.Label):
    __gtype_name__ = "_FilterLabel"
    TEMPLATE = _("Filter: %s")
    ON = "<b>%s</b>" % _("On")
    OFF = _("Off")
    def __init__(self):
        gtk.Label.__init__(self)
        self._value = None

    def get_value(self):
        return self._value

    def set_value(self, value):
        self._value = value
        self.set_markup(self.TEMPLATE % (self.ON if value else self.OFF))


class StatusBar(gtk.Statusbar, component.Component):
    __gtype_name__ = "StatusBar"
    def __init__(self):
        gtk.Statusbar.__init__(self)
        component.Component.__init__(self, "Statusbar")

        self._build_labels()
        self.show_all()

    def _build_labels(self):
        total = self._total = _TotalLabel()
        self._filter = _FilterLabel()
        filterbox = gtk.EventBox()
        filterbox.connect("button-press-event", self.on_filterbox_clicked)
        filterbox.add(self._filter)
        try:
            box = self.get_message_area()
        except AttributeError:
            # PyGTK < 2.22
            return
        box.pack_start(total, False, False)
        box.pack_start(filterbox, False, False, 4)

    def on_filterbox_clicked(self, widget, event):
        #TODO
        pass

    def display_message(self, message, timeout=3):
        def timer_cb():
            self.pop(0)
            return False
        self.push(0, message)
        gobject.timeout_add_seconds(timeout, timer_cb)

    def get_total(self):
        return self._total.get_value()

    def set_total(self, value):
        self._total.set_value(value)

    def get_filter(self):
        return self._filter.get_value()

    def set_filter(self, value):
        self._filter.set_value(value)

