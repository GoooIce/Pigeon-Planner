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

from pigeonplanner import database
from pigeonplanner import messages
from pigeonplanner.ui import builder
from pigeonplanner.ui.widgets import comboboxes
from pigeonplanner.ui.messagedialog import QuestionDialog
from pigeonplanner.core import enums
from pigeonplanner.core import common
from pigeonplanner.core import pigeonparser


class DataManager(builder.GtkBuilder):
    def __init__(self, parent):
        builder.GtkBuilder.__init__(self, "DataManager.ui")

        # XXX: Translated strings are not unicode on some Windows XP systems
        # that were tested.
        self.tables = {unicode(_("Colours")): database.Tables.COLOURS,
                       unicode(_("Sectors")): database.Tables.SECTORS,
                       unicode(_("Types")): database.Tables.TYPES,
                       unicode(_("Categories")): database.Tables.CATEGORIES,
                       unicode(_("Racepoints")): database.Tables.RACEPOINTS,
                       unicode(_("Strains")): database.Tables.STRAINS,
                       unicode(_("Lofts")): database.Tables.LOFTS,
                       unicode(_("Weather")): database.Tables.WEATHER,
                       unicode(_("Wind")): database.Tables.WIND}
        comboboxes.fill_combobox(self.widgets.comboset, self.tables.keys())

        self._build_treeview()
        self.widgets.window.set_transient_for(parent)
        self.widgets.window.show()

    # Callbacks
    def close_window(self, widget, event=None):
        self.widgets.window.destroy()

    def on_buttonhelp_clicked(self, widget):
        common.open_help(10)

    def on_buttonremove_clicked(self, widget):
        dataset = unicode(self.widgets.comboset.get_active_text())
        item = self.widgets.comboitem.get_active_text()
        if QuestionDialog(messages.MSG_REMOVE_ITEM,
                          self.widgets.window, (item, dataset)).run():
            database.remove_data(self.tables[dataset], item)
            index = self.widgets.comboitem.get_active()
            self.widgets.comboitem.remove_text(index)
            self.widgets.comboitem.set_active(0)

    def on_buttonadd_clicked(self, widget):
        dataset = unicode(self.widgets.comboset.get_active_text())
        item = self.widgets.entryitem.get_text()
        if dataset == _("Racepoints"):
            data = {"racepoint": item, "xco": "", "yco": "", "distance": "", "unit": ""}
            database.add_racepoint(data)
        else:
            database.add_data(self.tables[dataset], item)
        self.widgets.entryitem.set_text("")
        self._fill_item_combobox(dataset)

    def on_comboset_changed(self, widget):
        dataset = unicode(widget.get_active_text())
        self._fill_item_combobox(dataset)

    def on_entryitem_changed(self, widget):
        value = len(widget.get_text()) > 0
        self.widgets.buttonadd.set_sensitive(value)

    def on_buttonsearch_clicked(self, widget):
        self.widgets.messagebox.hide()
        self.widgets.liststore.clear()
        for pindex, pigeon in pigeonparser.parser.pigeons.iteritems():
            if pigeon.get_visible(): continue
            if pigeon.get_sex() == enums.Sex.unknown: continue
            is_parent = database.pigeon_is_a_parent(*pigeon.get_band())
            if not is_parent:
                self.widgets.liststore.insert(0, [pigeon, False, pigeon.get_band_string()])

        if len(self.widgets.liststore) == 0:
            self.widgets.messagebox.show()

    def on_buttoninfo_clicked(self, widget):
        model, node = self.widgets.selection.get_selected()
        pigeon = self.widgets.liststore.get_value(node, 0)
        if not pigeon.get_pindex() in pigeonparser.parser.pigeons:
            return
        from pigeonplanner.ui.detailsview import DetailsDialog
        DetailsDialog(pigeon, self.widgets.window)

    def on_buttondelete_clicked(self, widget):
        for row_num in range(len(self.widgets.liststore)-1, -1, -1):
            row = self.widgets.liststore[row_num]
            if not row[1]: continue
            pindex = row[0].get_pindex()
            database.remove_pigeon(pindex)
            pigeonparser.parser.remove_pigeon(pindex)
            self.widgets.liststore.remove(row.iter)
        self.widgets.buttondelete.set_sensitive(False)

    def on_selection_changed(self, selection):
        model, node = selection.get_selected()
        value = False if node is None else True
        self.widgets.buttoninfo.set_sensitive(value)

    def on_selection_toggled(self, cell, path):
        row = self.widgets.liststore[path]
        row[1] = not row[1]
        value = row[1]
        if not value:
            for row in self.widgets.liststore:
                if row[1]:
                    value = True
                    break
        self.widgets.buttondelete.set_sensitive(value)

    # Private methods
    def _fill_item_combobox(self, dataset):
        data = database.get_all_data(self.tables[dataset])
        comboboxes.fill_combobox(self.widgets.comboitem, data)
        value = self.widgets.comboitem.get_active_text() is not None
        self.widgets.buttonremove.set_sensitive(value)

    def _build_treeview(self):
        self.widgets.selection = self.widgets.treeview.get_selection()
        self.widgets.selection.connect("changed", self.on_selection_changed)
        self.widgets.liststore = gtk.ListStore(object, bool, str)
        self.widgets.treeview.set_model(self.widgets.liststore)

        textrenderer = gtk.CellRendererText()
        boolrenderer = gtk.CellRendererToggle()
        boolrenderer.connect("toggled", self.on_selection_toggled)

        check = gtk.CheckButton()
        check.set_active(True)
        check.show()
        mark_column = gtk.TreeViewColumn(None, boolrenderer, active=1)
        mark_column.set_widget(check)
        mark_column.set_sort_column_id(1)
        self.widgets.treeview.append_column(mark_column)
        band_column = gtk.TreeViewColumn(None, textrenderer, text=2)
        band_column.set_sort_column_id(2)
        self.widgets.treeview.append_column(band_column)

