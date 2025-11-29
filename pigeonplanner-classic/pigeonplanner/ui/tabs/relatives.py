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
import gtk.gdk

from pigeonplanner import messages
from pigeonplanner.ui import utils
from pigeonplanner.ui import component
from pigeonplanner.ui import WidgetFactory
from pigeonplanner.ui.tabs import basetab
from pigeonplanner.ui.utils import HiddenPigeonsMixin
from pigeonplanner.ui.detailsview import DetailsDialog
from pigeonplanner.ui.messagedialog import InfoDialog
from pigeonplanner.core import enums
from pigeonplanner.core import pigeonparser


class RelativesTab(WidgetFactory, basetab.BaseTab, HiddenPigeonsMixin):
    def __init__(self):
        WidgetFactory.__init__(self)
        basetab.BaseTab.__init__(self, "RelativesTab", _("Relatives"), "icon_relatives.png")

        treeviewdirect = gtk.TreeView()
        swdirect = gtk.ScrolledWindow()
        swdirect.set_shadow_type(gtk.SHADOW_IN)
        swdirect.set_policy(gtk.POLICY_AUTOMATIC, gtk.POLICY_AUTOMATIC)
        swdirect.add(treeviewdirect)
        aligndirect = gtk.Alignment(.5, .5, 1, 1)
        aligndirect.add(swdirect)
        framedirect = gtk.Frame(_("<b>Brothers and sisters</b>"))
        framedirect.set_shadow_type(gtk.SHADOW_NONE)
        framedirect.get_label_widget().set_use_markup(True)
        framedirect.add(aligndirect)
        self._liststoredirect = self._build_treeview(treeviewdirect)

        treeviewhalf = gtk.TreeView()
        swhalf = gtk.ScrolledWindow()
        swhalf.set_shadow_type(gtk.SHADOW_IN)
        swhalf.set_policy(gtk.POLICY_AUTOMATIC, gtk.POLICY_AUTOMATIC)
        swhalf.add(treeviewhalf)
        alignhalf = gtk.Alignment(.5, .5, 1, 1)
        alignhalf.add(swhalf)
        framehalf = gtk.Frame(_("<b>Half brothers and sisters</b>"))
        framehalf.set_shadow_type(gtk.SHADOW_NONE)
        framehalf.get_label_widget().set_use_markup(True)
        framehalf.add(alignhalf)
        self._liststorehalf = self._build_treeview(treeviewhalf, True)

        treeviewoff = gtk.TreeView()
        swoff = gtk.ScrolledWindow()
        swoff.set_shadow_type(gtk.SHADOW_IN)
        swoff.set_policy(gtk.POLICY_AUTOMATIC, gtk.POLICY_AUTOMATIC)
        swoff.add(treeviewoff)
        alignoff = gtk.Alignment(.5, .5, 1, 1)
        alignoff.add(swoff)
        frameoff = gtk.Frame(_("<b>Offspring</b>"))
        frameoff.set_shadow_type(gtk.SHADOW_NONE)
        frameoff.get_label_widget().set_use_markup(True)
        frameoff.add(alignoff)
        self._liststoreoff = self._build_treeview(treeviewoff)

        self.widgets._root = gtk.HBox(True)
        self.widgets._root.pack_start(framedirect, True, True, 4)
        self.widgets._root.pack_start(framehalf, True, True, 0)
        self.widgets._root.pack_start(frameoff, True, True, 4)
        self.widgets._root.show_all()

    # Callbacks
    def on_treeview_press(self, treeview, event):
        pthinfo = treeview.get_path_at_pos(int(event.x), int(event.y))
        if pthinfo is None: return
        path, col, cellx, celly = pthinfo
        pigeon = treeview.get_model()[path][0]

        if event.button == 3:
            items = [(gtk.STOCK_INFO, self.on_show_details, (pigeon,), None),
                     (gtk.STOCK_EDIT, self.on_edit_details, (pigeon,), None)]
            if pigeon.show:
                items.append((gtk.STOCK_JUMP_TO, self.on_goto_pigeon, (pigeon,), None))
            utils.popup_menu(event, items)
        elif event.button == 1 and event.type == gtk.gdk._2BUTTON_PRESS:
            self.on_show_details(None, pigeon)

    def on_show_details(self, widget, pigeon):
        if not pigeon.get_pindex() in pigeonparser.parser.pigeons:
            return
        DetailsDialog(pigeon, self._parent)

    def on_edit_details(self, widget, pigeon):
        if not pigeon.get_pindex() in pigeonparser.parser.pigeons:
            return

        dialog = DetailsDialog(pigeon, self._parent, enums.Action.edit)
        dialog.details.set_details(pigeon)

    def on_goto_pigeon(self, widget, pigeon):
        if not component.get("Treeview").select_pigeon(None, pigeon.get_pindex()):
            InfoDialog(messages.MSG_NO_PIGEON, self._parent)

    # Public methods
    def set_pigeon(self, pigeon):
        self.clear_pigeon()
        pindex_selected = pigeon.get_pindex()
        pindex_sire_sel = pigeon.get_sire_pindex()
        pindex_dam_sel = pigeon.get_dam_pindex()
        for pindex, pigeon in pigeonparser.parser.pigeons.items():
            ring, year = pigeon.get_band()
            pindex_sire = pigeon.get_sire_pindex()
            pindex_dam = pigeon.get_dam_pindex()
            sex = pigeon.get_sex()
            seximg = utils.get_sex_image(sex)
            # Offspring
            if pindex_sire == pindex_selected or pindex_dam == pindex_selected:
                self._liststoreoff.insert(0, [pigeon, ring, year, sex, seximg])
            # Half relatives
            if pindex_sire_sel and pindex_sire_sel == pindex_sire and not\
               (pindex_sire_sel == pindex_sire and pindex_dam_sel == pindex_dam):
                self._liststorehalf.insert(0, [pigeon, ring, year,
                                               pigeon.get_sire_string(True), sex, seximg])
            if pindex_dam_sel and pindex_dam_sel == pindex_dam and not\
               (pindex_sire_sel == pindex_sire and pindex_dam_sel == pindex_dam):
                self._liststorehalf.insert(0, [pigeon, ring, year,
                                               pigeon.get_dam_string(True), sex, seximg])
            # Direct relatives
            # We need both sire and dam to retrieve these
            if not pindex_sire_sel or not pindex_dam_sel: continue
            if pindex_sire_sel == pindex_sire and pindex_dam_sel == pindex_dam\
               and not pindex == pindex_selected:
                self._liststoredirect.insert(0, [pigeon, ring, year, sex, seximg])

        self._liststoredirect.set_sort_column_id(1, gtk.SORT_ASCENDING)
        self._liststoredirect.set_sort_column_id(2, gtk.SORT_ASCENDING)
        self._liststorehalf.set_sort_column_id(1, gtk.SORT_ASCENDING)
        self._liststorehalf.set_sort_column_id(2, gtk.SORT_ASCENDING)
        self._liststoreoff.set_sort_column_id(1, gtk.SORT_ASCENDING)
        self._liststoreoff.set_sort_column_id(2, gtk.SORT_ASCENDING)

    def clear_pigeon(self):
        self._liststoredirect.clear()
        self._liststorehalf.clear()
        self._liststoreoff.clear()

    # Internal methods
    def _build_treeview(self, treeview, extended=False):
        pb_id = 4
        store = [object, str, str, str, gtk.gdk.Pixbuf]
        columns = [_("Band no."), _("Year")]
        if extended:
            pb_id = 5
            store.insert(1, str)
            columns.append(_("Common parent"))
        liststore = gtk.ListStore(*store)
        modelfilter = liststore.filter_new()
        modelfilter.set_visible_func(self._visible_func)
        treeview.set_model(modelfilter)
        treeview.connect("button-press-event", self.on_treeview_press)
        for index, column in enumerate(columns):
            textrenderer = gtk.CellRendererText()
            tvcolumn = gtk.TreeViewColumn(column, textrenderer, text=index+1)
            tvcolumn.set_sort_column_id(index+1)
            tvcolumn.set_resizable(True)
            tvcolumn.set_cell_data_func(textrenderer, self._cell_func)
            treeview.append_column(tvcolumn)
        pbrenderer = gtk.CellRendererPixbuf()
        pbrenderer.set_property("xalign", 0.0)
        tvcolumn = gtk.TreeViewColumn(_("Sex"), pbrenderer, pixbuf=pb_id)
        tvcolumn.set_sort_column_id(pb_id-1)
        tvcolumn.set_resizable(True)
        tvcolumn.set_cell_data_func(pbrenderer, self._cell_func)
        treeview.append_column(tvcolumn)

        return liststore

