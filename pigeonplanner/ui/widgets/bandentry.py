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

from pigeonplanner.ui import dialogs
from pigeonplanner.core import common
from pigeonplanner.core import checks
from pigeonplanner.core import errors


class BandEntry(gtk.HBox):
    __gtype_name__ = "BandEntry"
    __gsignals__ = {"search-clicked" : (gobject.SIGNAL_RUN_LAST, object, ())}
    can_empty = gobject.property(type=bool, default=False, nick="Can empty")
    def __init__(self, editable=False, can_empty=False, has_search=False):
        gtk.HBox.__init__(self)

        self._entryband = gtk.Entry()
        self._entryband.set_width_chars(15)
        self._entryband.set_alignment(.5)
        self._entryyear = gtk.Entry(4)
        self._entryyear.set_width_chars(4)
        label = gtk.Label("/")

        hbox = gtk.HBox()
        hbox.pack_start(self._entryband, False, True, 0)
        hbox.pack_start(label, False, True, 4)
        hbox.pack_start(self._entryyear, False, True, 0)

        self._viewport = gtk.Viewport()
        self._viewport.add(hbox)

        image = gtk.image_new_from_stock(gtk.STOCK_FIND, gtk.ICON_SIZE_BUTTON)
        self._button = gtk.Button()
        self._button.add(image)
        self._button.set_relief(gtk.RELIEF_NONE)
        self._button.set_focus_on_click(False)
        self._button.set_no_show_all(True)
        self._button.connect("clicked", self.on_button_clicked)

        self.pack_start(self._viewport, False, False, 0)
        self.pack_start(self._button, False, False, 0)
        self.show_all()

        self.editable = editable
        self.can_empty = can_empty
        self.has_search = has_search

    def get_editable(self):
        return self._editable

    def set_editable(self, editable):
        self._editable = editable
        self._viewport.set_shadow_type(gtk.SHADOW_NONE if editable else gtk.SHADOW_IN)
        self._entryband.set_activates_default(editable)
        self._entryyear.set_activates_default(editable)
        self._entryband.set_has_frame(editable)
        self._entryband.set_editable(editable)
        self._entryyear.set_has_frame(editable)
        self._entryyear.set_editable(editable)
    editable = gobject.property(get_editable, set_editable, bool, False, nick="Editable")

    def get_has_search(self):
        return self._has_search

    def set_has_search(self, has_search):
        self._has_search = has_search
        self._button.set_visible(has_search)
        self._button.child.set_visible(has_search)
    has_search = gobject.property(get_has_search, set_has_search, bool, False, nick="Has search")

    def is_empty(self):
        return len(self.get_pindex(False)) == 0

    def set_pindex(self, pindex):
        self.set_band(*common.get_band_from_pindex(pindex))

    def set_band(self, band, year):
        self._unwarn()
        self._entryband.set_text(band)
        self._entryyear.set_text(year)

    def get_pindex(self, validate=True):
        band, year = self.get_band(validate)
        return common.get_pindex_from_band(band, year)

    def get_band(self, validate=True):
        band, year = self._entryband.get_text(), self._entryyear.get_text()
        if validate:
            self.__validate(band, year)
        return band, year

    def clear(self):
        self.set_band("", "")

    def grab_focus(self):
        self._entryband.grab_focus()
        self._entryband.set_position(-1)

    def _warn(self):
        self._entryband.set_icon_from_stock(gtk.ENTRY_ICON_PRIMARY, gtk.STOCK_STOP)

    def _unwarn(self):
        self._entryband.set_icon_from_stock(gtk.ENTRY_ICON_PRIMARY, None)

    def __validate(self, band, year):
        if self.can_empty and (band == "" and year == ""):
            return

        try:
            checks.check_ring_entry(band, year)
        except errors.InvalidInputError:
            self._warn()
            raise

        self._unwarn()

    def on_button_clicked(self, widget):
        try:
            pindex, sex, year = self.emit("search-clicked")
        except TypeError:
            return

        parent = self.get_toplevel()
        dialog = dialogs.PigeonListDialog(parent)
        dialog.fill_treeview(pindex, sex, year)
        response = dialog.run()
        if response == gtk.RESPONSE_APPLY:
            pigeon = dialog.get_selected()
            self.set_pindex(pigeon.get_pindex())
        dialog.destroy()

