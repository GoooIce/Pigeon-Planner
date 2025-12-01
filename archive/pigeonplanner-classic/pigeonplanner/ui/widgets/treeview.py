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

from pigeonplanner import database
from pigeonplanner.ui import utils
from pigeonplanner.ui import builder
from pigeonplanner.ui import component
from pigeonplanner.core import config
from pigeonplanner.core import pigeonparser


class FilterDialog(builder.GtkBuilder):
    def __init__(self, treeview):
        builder.GtkBuilder.__init__(self, "FilterDialog.ui")
        self.treeview = treeview

        self.filter = utils.TreeviewFilter()

        self.widgets.combocolour.set_data(database.get_all_data(database.Tables.COLOURS), sort=False, active=None)
        self.widgets.combostrain.set_data(database.get_all_data(database.Tables.STRAINS), sort=False, active=None)
        self.widgets.comboloft.set_data(database.get_all_data(database.Tables.LOFTS), sort=False, active=None)

    def show(self, parent):
        self.widgets.filterdialog.set_transient_for(parent)
        self.widgets.filterdialog.show_all()

    def hide(self):
        self.widgets.filterdialog.hide()

    def on_close(self, widget, event=None):
        self.widgets.filterdialog.hide()
        return True

    def on_spinbutton_output(self, widget):
        value = widget.get_value_as_int()
        text = "" if value == 0 else str(value)
        widget.set_text(text)
        return True

    def on_checksex_toggled(self, widget):
        self.widgets.combosex.set_sensitive(widget.get_active())

    def on_checkstatus_toggled(self, widget):
        self.widgets.combostatus.set_sensitive(widget.get_active())

    def on_clear_clicked(self, widget):
        for combo in ["year", "sex", "status"]:
            getattr(self.widgets, "combo"+combo).set_active(0)
        for spin in ["year"]:
            getattr(self.widgets, "spin"+spin).set_value(0)
        for combo in ["colour", "strain", "loft"]:
            getattr(self.widgets, "combo"+combo).child.set_text("")
        for check in ["sex", "status"]:
            getattr(self.widgets, "check"+check).set_active(False)

        self.filter.clear()
        self.treeview._modelfilter.refilter()
        component.get("Statusbar").set_filter(False)
        self.treeview.emit("pigeons-changed")

    def on_search_clicked(self, widget):
        self.filter.clear()

        year = self.widgets.spinyear.get_value_as_int()
        yearop = self.widgets.comboyear.get_operator()
        self.filter.add("year", year, yearop, int)

        if self.widgets.checksex.get_active():
            sex = self.widgets.combosex.get_sex()
            self.filter.add("sex", sex, type_=int, allow_empty_value=True)

        if self.widgets.checkstatus.get_active():
            status = self.widgets.combostatus.get_status()
            self.filter.add("active", status, type_=int, allow_empty_value=True)

        colour = self.widgets.combocolour.child.get_text()
        self.filter.add("colour", colour)

        strain = self.widgets.combostrain.child.get_text()
        self.filter.add("strain", strain)

        loft = self.widgets.comboloft.child.get_text()
        self.filter.add("loft", loft)

        self.treeview._modelfilter.refilter()
        component.get("Statusbar").set_filter(self.filter.has_filters())
        self.treeview.emit("pigeons-changed")


class MainTreeView(gtk.TreeView, component.Component):

    __gtype_name__ = "MainTreeView"
    __gsignals__ = {"pigeons-changed": (gobject.SIGNAL_RUN_LAST, None, ())}

    def __init__(self):
        gtk.TreeView.__init__(self)
        component.Component.__init__(self, "Treeview")

        component.get("Statusbar").set_filter(False)
        self._liststore = self._build_treeview()
        self._modelfilter = self._liststore.filter_new()
        self._modelfilter.set_visible_func(self._visible_func)
        self._modelsort = gtk.TreeModelSort(self._modelfilter)
        self._modelsort.set_sort_func(3, self._sort_func)
        self._modelsort.set_sort_column_id(3, gtk.SORT_ASCENDING)
        self.set_model(self._modelsort)
        self.set_rules_hint(True)
        self._selection = self.get_selection()
        self._selection.set_mode(gtk.SELECTION_MULTIPLE)
        self._filterdialog = FilterDialog(self)
        self.set_columns()
        self.show_all()

    # Public methods
    def get_top_iter(self, rowiter):
        filteriter = self._modelfilter.convert_child_iter_to_iter(rowiter)
        return self._modelsort.convert_child_iter_to_iter(None, filteriter)

    def get_child_iter(self, rowiter):
        filteriter = self._modelsort.convert_iter_to_child_iter(None, rowiter)
        return self._modelfilter.convert_iter_to_child_iter(filteriter)

    def get_top_path(self, path):
        filterpath = self._modelfilter.convert_child_path_to_path(path)
        return self._modelsort.convert_child_path_to_path(filterpath)

    def get_child_path(self, path):
        filterpath = self._modelsort.convert_path_to_child_path(path)
        return self._modelfilter.convert_path_to_child_path(filterpath)

    def add_row(self, row, select=True):
        rowiter = self._liststore.insert(0, row)
        if select:
            try:
                topiter = self.get_top_iter(rowiter)
            except RuntimeError:
                # This happens when a pigeon is added which falls outside the current
                # active filter. It means the pigeon shouldn't be shown and thus there
                # is no iter for the row.
                pass
            else:
                path = self._liststore.get_path(rowiter)
                self._selection.unselect_all()
                self._selection.select_iter(topiter)
                self.scroll_to_cell(self.get_top_path(path))
        self.emit("pigeons-changed")

    def update_row(self, data, rowiter=None, path=None):
        if rowiter is None and path is None:
            raise ValueError("A path or iter is required!")
        if rowiter is None:
            rowiter = self._liststore.get_iter(path)
        self._liststore.set(rowiter, *data)
        self.emit("pigeons-changed")

    def remove_row(self, path):
        sortiter = self._modelsort.get_iter(path)
        rowiter = self.get_child_iter(sortiter)
        self._liststore.remove(rowiter)
        self.emit("pigeons-changed")

    def get_n_rows(self):
        return len(self._liststore)

    def fill_treeview(self, path=0):
        self._liststore.clear()
        for pindex, pigeon in pigeonparser.parser.pigeons.items():
            if not config.get("interface.show-all-pigeons") and not pigeon.get_visible():
                continue
            ring, year = pigeon.get_band()
            self._liststore.insert(0, [pigeon, pindex, ring, year,
                                       pigeon.get_name(), pigeon.get_colour(),
                                       pigeon.get_sex_string(),
                                       pigeon.get_loft(), pigeon.get_strain(),
                                       pigeon.get_status(),
                                       utils.get_sex_image(pigeon.sex)])
        self._selection.select_path(path)
        self.emit("pigeons-changed")

    def add_pigeon(self, pigeon, select=True):
        ring, year = pigeon.get_band()
        row = [pigeon, pigeon.get_pindex(), ring, year, pigeon.get_name(),
               pigeon.get_colour(), pigeon.get_sex_string(),
               pigeon.get_loft(), pigeon.get_strain(),
               pigeon.get_status(),
               utils.get_sex_image(pigeon.sex)]
        self.add_row(row, select)

    def update_pigeon(self, pigeon, rowiter=None, path=None):
        band, year = pigeon.get_band()
        data = (0, pigeon, 1, pigeon.get_pindex(), 2, band, 3, year,
                4, pigeon.get_name(), 5, pigeon.get_colour(),
                6, pigeon.get_sex_string(), 7, pigeon.get_loft(),
                8, pigeon.get_strain(), 9, _(pigeon.get_status()),
                10, utils.get_sex_image(pigeon.sex))
        self.update_row(data, rowiter=rowiter, path=path)

    def has_pigeon(self, pigeon):
        for row in self._liststore:
            if self._liststore.get_value(row.iter, 0) == pigeon:
                return True
        return False

    def select_pigeon(self, widget, pindex):
        """
        Select the pigeon in the main treeview

        @param widget: Only given when selected through menu
        @param pindex: The index of the pigeon to search
        """

        for row in self._modelsort:
            if self._modelsort.get_value(row.iter, 1) == pindex:
                self._selection.unselect_all()
                self._selection.select_iter(row.iter)
                self.scroll_to_cell(row.path)
                self.grab_focus()
                return True
        return False

    def select_all_pigeons(self):
        self._selection.select_all()

    def get_pigeons(self, filtered=False):
        model = self._modelsort if filtered else self._liststore
        return [row[0] for row in model]

    def get_selected_pigeon(self):
        model, paths = self._selection.get_selected_rows()
        if len(paths) == 1:
            path = paths[0]
            return model[path][0]
        elif len(paths) > 1:
            return [model[path][0] for path in paths]
        else:
            return None

    def set_columns(self):
        columnsdic = {2: config.get("columns.pigeon-name"),
                      3: config.get("columns.pigeon-colour"),
                      4: config.get("columns.pigeon-sex"),
                      5: config.get("columns.pigeon-loft"),
                      6: config.get("columns.pigeon-strain"),
                      7: config.get("columns.pigeon-status")}
        for key, value in columnsdic.items():
            self.get_column(key).set_visible(value)
            if key == 4 and value:
                sexcoltype = config.get("columns.pigeon-sex-type")
                for renderer in self.get_column(key).get_cell_renderers():
                    if isinstance(renderer, gtk.CellRendererText):
                        text = renderer
                    else:
                        pixbuf = renderer
                text.set_visible(sexcoltype == 1 or sexcoltype == 3)
                pixbuf.set_visible(sexcoltype == 2 or sexcoltype == 3)

    def run_filterdialog(self, parent):
        self._filterdialog.show(parent)

    # Internal methods
    def _build_treeview(self):
        liststore = gtk.ListStore(object, str, str, str, str, str, str, str, str, str, gtk.gdk.Pixbuf)
        columns = [_("Band no."), _("Year"), _("Name"), _("Colour"), _("Sex"),
                   _("Loft"), _("Strain"), _("Status")]
        for index, column in enumerate(columns):
            tvcolumn = gtk.TreeViewColumn(column)
            if index == 4:
                renderer = gtk.CellRendererPixbuf()
                tvcolumn.pack_start(renderer, expand=False)
                tvcolumn.add_attribute(renderer, "pixbuf", 10)
            textrenderer = gtk.CellRendererText()
            tvcolumn.pack_start(textrenderer, expand=False)
            tvcolumn.add_attribute(textrenderer, "text", index+2)
            tvcolumn.set_sort_column_id(index+2)
            tvcolumn.set_resizable(True)
            self.append_column(tvcolumn)
        return liststore

    def _visible_func(self, model, treeiter):
        pigeon = model[treeiter][0]
        for item in self._filterdialog.filter:
            pvalue = getattr(pigeon, item.name)
            if not item.operator(item.type(pvalue), item.type(item.value)):
                return False
        return True

    def _sort_func(self, model, iter1, iter2):
        data1 = model.get_value(iter1, 3)
        data2 = model.get_value(iter2, 3)
        if data1 == data2:
            data1 = model.get_value(iter1, 2)
            data2 = model.get_value(iter2, 2)
        return cmp(data1, data2)

