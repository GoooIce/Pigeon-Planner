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

from pigeonplanner import messages
from pigeonplanner import database
from pigeonplanner.ui import utils
from pigeonplanner.ui import builder
from pigeonplanner.ui.widgets import latlongentry
from pigeonplanner.ui.messagedialog import QuestionDialog
from pigeonplanner.core import enums
from pigeonplanner.core import errors


def check_user_info(parent, name):
    """
    Check if the user has entered his personal info

    @param parent: A parent window
    @param name: The name of the user
    """

    if name == "":
        if QuestionDialog(messages.MSG_NO_INFO, parent).run():
            book = AddressBook(parent)
            book.on_buttonadd_clicked(None)
            book.widgets.checkme.set_active(True)
            return False
    return True


class AddressBook(builder.GtkBuilder):
    def __init__(self, parent):
        builder.GtkBuilder.__init__(self, "AddressBook.ui")

        self._mode = None
        self._entries = self.get_objects_from_prefix("entry")
        self._normalbuttons = [self.widgets.buttonadd,
                               self.widgets.buttonedit,
                               self.widgets.buttonremove]
        self._editbuttons = [self.widgets.buttonsave, self.widgets.buttoncancel]
        self._fill_treeview()
        self.widgets.selection = self.widgets.treeview.get_selection()
        self.widgets.selection.connect("changed", self.on_selection_changed)
        self.widgets.selection.select_path(0)

        self.widgets.addressbookwindow.set_transient_for(parent)
        self.widgets.addressbookwindow.show()

    # Callbacks
    def close_window(self, widget, event=None):
        self.widgets.addressbookwindow.destroy()

    def on_buttonadd_clicked(self, widget):
        self._mode = enums.Action.add
        self._set_widgets(True)
        self._empty_entries()

    def on_buttonedit_clicked(self, widget):
        self._mode = enums.Action.edit
        self._set_widgets(True)

    def on_buttonremove_clicked(self, widget):
        model, rowiter = self.widgets.selection.get_selected()
        path = self.widgets.liststore.get_path(rowiter)
        key, name = model[rowiter][0], model[rowiter][1]

        if not QuestionDialog(messages.MSG_REMOVE_ADDRESS,
                              self.widgets.addressbookwindow, name).run():
            return

        database.remove_address(key)
        self.widgets.liststore.remove(rowiter)
        self.widgets.selection.select_path(path)

    def on_buttonsave_clicked(self, widget):
        try:
            data = self._get_entry_data()
        except errors.InvalidInputError:
            return
        self._set_widgets(False)
        if self._mode == enums.Action.add:
            rowid = database.add_address(data)
            rowiter = self.widgets.liststore.insert(0, [rowid, data["name"]])
            self.widgets.selection.select_iter(rowiter)
            path = self.widgets.liststore.get_path(rowiter)
            self.widgets.treeview.scroll_to_cell(path)
        else:
            database.update_address(self._get_address_key(), data)
            model, rowiter = self.widgets.selection.get_selected()
            self.widgets.liststore.set_value(rowiter, 1, data["name"])
            self.widgets.selection.emit("changed")

    def on_buttoncancel_clicked(self, widget):
        self._set_widgets(False)
        self.widgets.selection.emit("changed")

    def on_selection_changed(self, selection):
        model, rowiter = selection.get_selected()

        widgets = [self.widgets.buttonremove, self.widgets.buttonedit]
        if rowiter:
            utils.set_multiple_sensitive(widgets, True)
        else:
            utils.set_multiple_sensitive(widgets, False)
            self._empty_entries()
            return

        data = database.get_address_data({"Addresskey": model[rowiter][0]})
        self.widgets.entryname.set_text(data["name"])
        self.widgets.entrystreet.set_text(data["street"])
        self.widgets.entryzip.set_text(data["code"])
        self.widgets.entrycity.set_text(data["city"])
        self.widgets.entrycountry.set_text(data["country"])
        self.widgets.entryphone.set_text(data["phone"])
        self.widgets.entryemail.set_text(data["email"])
        self.widgets.entrycomment.set_text(data["comment"])
        self.widgets.checkme.set_active(data["me"])
        self.widgets.entrylat.set_text(data["latitude"])
        self.widgets.entrylong.set_text(data["longitude"])

    # Internal methods
    def _fill_treeview(self):
        self.widgets.liststore.clear()
        for item in database.get_all_addresses():
            self.widgets.liststore.insert(0, [item["Addresskey"], item["name"]])
        self.widgets.liststore.set_sort_column_id(1, gtk.SORT_ASCENDING)

    def _set_widgets(self, value):
        """
        Set the widgets tot their correct state for adding/editing

        @param value: True for edit mode, False for normal
        """

        utils.set_multiple_sensitive([self.widgets.treeview], not value)
        utils.set_multiple_visible(self._normalbuttons, not value)
        utils.set_multiple_visible(self._editbuttons, value)
        show_me = database.get_address_data({"me": 1}) is None or \
                    (self._mode == enums.Action.edit and
                     database.get_address_data({"me": 1})[0] == self._get_address_key())
        utils.set_multiple_visible([self.widgets.checkme], show_me if value else False)

        shadow = gtk.SHADOW_NONE if value else gtk.SHADOW_IN
        for entry in self._entries:
            entry.set_editable(value)
            if isinstance(entry, latlongentry.LatLongEntry):
                # These will handle the frame itself by setting it editable
                continue
            entry.set_has_frame(value)
            entry.get_parent().set_shadow_type(shadow)

        self.widgets.entryname.grab_focus()
        self.widgets.entryname.set_position(-1)

    def _get_entry_data(self):
        return {"name": self.widgets.entryname.get_text(),
                "street": self.widgets.entrystreet.get_text(),
                "code": self.widgets.entryzip.get_text(),
                "city": self.widgets.entrycity.get_text(),
                "country": self.widgets.entrycountry.get_text(),
                "phone": self.widgets.entryphone.get_text(),
                "email": self.widgets.entryemail.get_text(),
                "comment": self.widgets.entrycomment.get_text(),
                "me": int(self.widgets.checkme.get_active()),
                "latitude": self.widgets.entrylat.get_text(),
                "longitude": self.widgets.entrylong.get_text()}

    def _get_address_key(self):
        model, rowiter = self.widgets.selection.get_selected()
        return model[rowiter][0]

    def _empty_entries(self):
        for entry in self._entries:
            entry.set_text("")

