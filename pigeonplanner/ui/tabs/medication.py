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
from pigeonplanner.ui import utils
from pigeonplanner.ui import builder
from pigeonplanner.ui import dialogs
from pigeonplanner.ui.tabs import basetab
from pigeonplanner.ui.widgets import comboboxes
from pigeonplanner.ui.messagedialog import ErrorDialog
from pigeonplanner.core import enums
from pigeonplanner.core import common
from pigeonplanner.core import errors
from pigeonplanner.core import pigeonparser


class MedicationTab(builder.GtkBuilder, basetab.BaseTab):
    def __init__(self):
        builder.GtkBuilder.__init__(self, "MedicationView.ui")
        basetab.BaseTab.__init__(self, "MedicationTab", _("Medication"), "icon_medication.png")

        self._mode = None
        self._expanded = False
        self.widgets.selection = self.widgets.treeview.get_selection()
        self.widgets.selection.connect("changed", self.on_selection_changed)
        self.widgets.dialog.set_transient_for(self._parent)

    # Callbacks
    def on_dialog_delete(self, widget, event):
        self.widgets.dialog.hide()
        return True

    def on_buttonhelp_clicked(self, widget):
        common.open_help(15)

    def on_treeview_press(self, treeview, event):
        pthinfo = treeview.get_path_at_pos(int(event.x), int(event.y))
        if pthinfo is None: return
        if event.button == 3:
            entries = [
                (gtk.STOCK_EDIT, self.on_buttonedit_clicked, None, None),
                (gtk.STOCK_REMOVE, self.on_buttonremove_clicked, None, None)]

            utils.popup_menu(event, entries)

    def on_buttonadd_clicked(self, widget):
        self._mode = enums.Action.add
        self._clear_dialog_widgets()
        self._fill_select_treeview()
        comboboxes.fill_combobox(self.widgets.comboloft,
                                 database.get_all_data(database.Tables.LOFTS))
        self.widgets.dialog.show()
        self.widgets.entrydate2.grab_focus()

    def on_buttonedit_clicked(self, widget):
        self._mode = enums.Action.edit
        self._fill_select_treeview()
        comboboxes.fill_combobox(self.widgets.comboloft,
                                 database.get_all_data(database.Tables.LOFTS))
        med = database.get_medication_for_id(self._get_selected_medid())
        self.widgets.entrydate2.set_text(med["date"])
        self.widgets.entrydescription2.set_text(med["description"])
        self.widgets.entryby2.set_text(med["doneby"])
        self.widgets.entrymedication2.set_text(med["medication"])
        self.widgets.entrydosage2.set_text(med["dosage"])
        self.widgets.entrycomment2.set_text(med["comment"])
        self.widgets.checkvaccination2.set_active(med["vaccination"])
        for row in self.widgets.liststoreselect:
            if not row[0]: continue
            if row[2] in database.get_pigeons_for_medid(med["medid"]):
                row[1] = True

        self.widgets.dialog.show()
        self.widgets.entrydate2.grab_focus()

    def on_buttonremove_clicked(self, widget):
        model, rowiter = self.widgets.selection.get_selected()
        path = self.widgets.liststore.get_path(rowiter)
        medid = model[rowiter][0]

        multiple = database.count_medication_records_for_medid(medid) > 1
        dialog = dialogs.MedicationRemoveDialog(self._parent, multiple)
        dialog.check.set_active(multiple)
        resp = dialog.run()
        if resp == gtk.RESPONSE_NO or resp == gtk.RESPONSE_DELETE_EVENT:
            dialog.destroy()
            return

        if dialog.check.get_active():
            data = {"medid": medid}
        else:
            data = {"medid": medid, "pindex": self.pindex}
        database.remove_medication(data)
        dialog.destroy()

        self.widgets.liststore.remove(rowiter)
        self.widgets.selection.select_path(path)

    def on_buttonsave_clicked(self, widget):
        try:
            data = self._get_entry_data()
        except errors.InvalidInputError as msg:
            ErrorDialog(msg.value, self._parent)
            return
        pigeons = [row[2] for row in self.widgets.liststoreselect if row[1]]
        if self._mode == enums.Action.add:
            data["medid"] = data["date"] + common.get_random_number(10)
            for pindex in pigeons:
                data["pindex"] = pindex
                database.add_medication(data)
                # Only fill med treeview on current pigeon
                if not pindex == self.pindex: continue
                rowiter = self.widgets.liststore.insert(0,
                                        [data["medid"], data["date"], data["description"]])
                self.widgets.selection.select_iter(rowiter)
                path = self.widgets.liststore.get_path(rowiter)
                self.widgets.treeview.scroll_to_cell(path)
        else:
            medid = self._get_selected_medid()
            pigeons_current = database.get_pigeons_for_medid(medid)
            for pindex in [pindex for pindex in pigeons if pindex not in pigeons_current]:
                tmpdata = {"medid": medid, "pindex": pindex}
                tmpdata.update(data)
                database.add_medication(tmpdata)
            for pindex in [p for p in pigeons_current if p not in pigeons]:
                database.remove_medication({"medid": medid, "pindex": pindex})
            database.update_medication(medid, data)
            model, rowiter = self.widgets.selection.get_selected()
            self.widgets.liststore.set(rowiter, 1, data["date"], 2, data["description"])
            self.widgets.selection.emit("changed")
        self.widgets.dialog.hide()

    def on_buttoncancel_clicked(self, widget):
        self.widgets.dialog.hide()

    def on_buttonexpand_clicked(self, widget):
        self._set_pigeon_list(not self._expanded)

    def on_checkloft_toggled(self, widget):
        if widget.get_active():
            self._select_loft()
        else:
            for row in self.widgets.liststoreselect:
                if not row[0]: continue
                row[1] = False

    def on_comboloft_changed(self, widget):
        if self.widgets.checkloft.get_active():
            self._select_loft()

    def on_celltoggle_toggled(self, cell, path):
        self.widgets.liststoreselect[path][1] =\
                            not self.widgets.liststoreselect[path][1]

    def on_selection_changed(self, selection):
        model, rowiter = selection.get_selected()
        widgets = [self.widgets.buttonremove, self.widgets.buttonedit]
        if rowiter is not None:
            utils.set_multiple_sensitive(widgets, True)
        else:
            utils.set_multiple_sensitive(widgets, False)

            for entry in self.get_objects_from_prefix("entry"):
                entry.set_text("")
            self.widgets.entrydate.set_text("")
            self.widgets.checkvaccination.set_active(False)
            return

        data = database.get_medication_for_id(model[rowiter][0])
        self.widgets.entrydate.set_text(data["date"])
        self.widgets.entrydescription.set_text(data["description"])
        self.widgets.entryby.set_text(data["doneby"])
        self.widgets.entrymedication.set_text(data["medication"])
        self.widgets.entrydosage.set_text(data["dosage"])
        self.widgets.entrycomment.set_text(data["comment"])
        self.widgets.checkvaccination.set_active(data["vaccination"])

    # Public methods
    def set_pigeon(self, pigeon):
        self.pindex = pigeon.get_pindex()
        self.widgets.liststore.clear()
        for med in database.get_medication_for_pigeon(self.pindex):
            self.widgets.liststore.insert(0, [med["medid"], med["date"], med["description"]])
        self.widgets.liststore.set_sort_column_id(1, gtk.SORT_ASCENDING)

    def clear_pigeon(self):
        self.widgets.liststore.clear()

    def get_pigeon_state_widgets(self):
        return [self.widgets.buttonadd]

    # Internal methods
    def _fill_select_treeview(self):
        self.widgets.liststoreselect.clear()
        for pindex, pigeon in pigeonparser.parser.pigeons.items():
            if not pigeon.get_visible():
                continue
            active = not self.pindex == pindex
            ring, year = pigeon.get_band()
            self.widgets.liststoreselect.insert(0, [active, not active, pindex,
                                                    ring, year])
        self.widgets.liststoreselect.set_sort_column_id(3, gtk.SORT_ASCENDING)
        self.widgets.liststoreselect.set_sort_column_id(4, gtk.SORT_ASCENDING)

    def _set_pigeon_list(self, value):
        self._expanded = value
        utils.set_multiple_visible([self.widgets.seperator,
                                    self.widgets.vboxexpand], value)
        img = gtk.STOCK_GO_BACK if value else gtk.STOCK_GO_FORWARD
        self.widgets.imageexpand.set_from_stock(img, gtk.ICON_SIZE_BUTTON)

    def _select_loft(self):
        loft = self.widgets.comboloft.get_active_text()
        for row in self.widgets.liststoreselect:
            if not row[0]: continue
            pigeon = pigeonparser.parser.get_pigeon(row[2])
            row[1] = pigeon.get_loft() == loft

    def _clear_dialog_widgets(self):
        for entry in self.get_objects_from_prefix("entry"):
            entry.set_text("")
        self.widgets.entrydate2.set_text(common.get_date())
        self.widgets.checkvaccination2.set_active(False)

    def _get_selected_medid(self):
        model, rowiter = self.widgets.selection.get_selected()
        return model[rowiter][0]

    def _get_entry_data(self):
        return {"date": self.widgets.entrydate2.get_text(),
                "description": self.widgets.entrydescription2.get_text(),
                "doneby": self.widgets.entryby2.get_text(),
                "medication": self.widgets.entrymedication2.get_text(),
                "dosage": self.widgets.entrydosage2.get_text(),
                "comment": self.widgets.entrycomment2.get_text(),
                "vaccination": int(self.widgets.checkvaccination2.get_active())}

