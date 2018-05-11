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

"""
Results window class
"""


import operator
import datetime

import gtk

from pigeonplanner import database
from pigeonplanner import messages
from pigeonplanner.ui import tools
from pigeonplanner.ui import utils
from pigeonplanner.ui import builder
from pigeonplanner.ui.filechooser import PdfSaver, ExportChooser
from pigeonplanner.ui.messagedialog import ErrorDialog
from pigeonplanner.core import common
from pigeonplanner.core import config
from pigeonplanner.core import errors
from pigeonplanner.reportlib import (report, ReportError, PRINT_ACTION_DIALOG,
                                     PRINT_ACTION_PREVIEW, PRINT_ACTION_EXPORT)
from pigeonplanner.reports.results import ResultsReport, ResultsReportOptions


def get_view_for_current_config():
    if config.get("interface.results-mode") == ClassicView.ID:
        return ClassicView
    else:
        return SplittedView


class BaseView(object):
    ID = None

    def __init__(self, root):
        self._root = root
        self.pigeon = None

        self.column2name = {
            self.LS_COL_DATE: "date",
            self.LS_COL_RACEPOINT: "point",
            self.LS_COL_TYPE: "type",
            self.LS_COL_WIND: "wind",
            self.LS_COL_WINDSPEED: "windspeed",
            self.LS_COL_WEATHER: "weather",
            self.LS_COL_TEMPERATURE: "temperature",
            self.LS_COL_BAND: "band",
            self.LS_COL_YEAR: "year",
            self.LS_COL_PLACED: "placestr",
            self.LS_COL_PLACEDINT: "place",
            self.LS_COL_COEF: "coefstr",
            self.LS_COL_COEFFLOAT: "coef",
            self.LS_COL_SPEED: "speedstr",
            self.LS_COL_SPEEDFLOAT: "speed",
            self.LS_COL_OUT: "out",
            self.LS_COL_SECTOR: "sector",
            self.LS_COL_CATEGORY: "category",
            self.LS_COL_COMMENT: "comment",
        }

        self.colname2string = {
            "date": _("Date"),
            "point": _("Racepoint"),
            "type": _("Type"),
            "wind": _("Wind"),
            "windspeed": _("Windspeed"),
            "weather": _("Weather"),
            "temperature": _("Temperature"),
            "band": _("Band no."),
            "year": _("Year"),
            "placestr": _("Placed"),
            "place": _("Placed"),
            "out": _("Out of"),
            "coefstr": _("Coefficient"),
            "coef": _("Coefficient"),
            "speedstr": _("Speed"),
            "speed": _("Speed"),
            "sector": _("Sector"),
            "category": _("Category"),
            "comment": _("Comment"),
        }

        self.build_ui()

    def _build_parent_frame(self, label, child):
        sw = gtk.ScrolledWindow()
        sw.set_shadow_type(gtk.SHADOW_IN)
        sw.set_policy(gtk.POLICY_AUTOMATIC, gtk.POLICY_AUTOMATIC)
        sw.add(child)
        label = gtk.Label("<b>%s</b>" % label)
        label.set_use_markup(True)
        frame = gtk.Frame()
        frame.set_label_widget(label)
        frame.set_shadow_type(gtk.SHADOW_NONE)
        frame.add(sw)

        return frame

    @property
    def maintree(self):
        raise NotImplementedError

    def build_ui(self):
        raise NotImplementedError

    def set_columns(self):
        raise NotImplementedError

    def fill_treeview(self):
        raise NotImplementedError

    def clear(self):
        raise NotImplementedError

    def refresh(self):
        raise NotImplementedError

    def refilter(self):
        raise NotImplementedError

    def set_filter(self, *args):
        raise NotImplementedError

    def update_filter(self):
        raise NotImplementedError

    def get_report_data(self):
        raise NotImplementedError


class ClassicView(BaseView):
    ID = 0

    (LS_COL_ID,
     LS_COL_BAND,
     LS_COL_YEAR,
     LS_COL_DATE,
     LS_COL_RACEPOINT,
     LS_COL_PLACED,
     LS_COL_OUT,
     LS_COL_COEF,
     LS_COL_SPEED,
     LS_COL_SECTOR,
     LS_COL_TYPE,
     LS_COL_CATEGORY,
     LS_COL_WIND,
     LS_COL_WINDSPEED,
     LS_COL_WEATHER,
     LS_COL_TEMPERATURE,
     LS_COL_COMMENT,
     LS_COL_PLACEDINT,
     LS_COL_COEFFLOAT,
     LS_COL_SPEEDFLOAT) = range(20)

    (COL_BAND,
     COL_YEAR,
     COL_DATE,
     COL_RACEPOINT,
     COL_PLACED,
     COL_OUT,
     COL_COEF,
     COL_SPEED,
     COL_SECTOR,
     COL_TYPE,
     COL_CATEGORY,
     COL_WIND,
     COL_WINDSPEED,
     COL_WEATHER,
     COL_TEMPERATURE,
     COL_COMMENT) = range(16)

    def __init__(self, root):
        BaseView.__init__(self, root)

    @property
    def maintree(self):
        return self.treeview

    def build_ui(self):
        self.liststore = gtk.ListStore(int, str, str, str, str, str, int, str, str, str, str,
                                       str, str, str, str, str, str, int, float, float)

        self.filtermodel = self.liststore.filter_new()
        self.filtermodel.set_visible_func(self._visible_func)
        self.sortmodel = gtk.TreeModelSort(self.filtermodel)
        self.sortmodel.set_sort_func(self.LS_COL_YEAR, self._sort_func)

        self.treeview = gtk.TreeView()
        self.treeview.set_model(self.sortmodel)
        self.treeview.set_rules_hint(True)
        self.treeview.set_enable_search(False)
        self.selection = self.treeview.get_selection()
        colnames = [("band", None), ("year", None),
                    ("date", None), ("point", None),
                    ("place", self.LS_COL_PLACEDINT), ("out", None),
                    ("coef", self.LS_COL_COEFFLOAT),
                    ("speed", self.LS_COL_SPEEDFLOAT), ("sector", None),
                    ("type", None), ("category", None),
                    ("wind", None), ("windspeed", None),
                    ("weather", None), ("temperature", None), ("comment", None)]
        for index, (colname, sortid) in enumerate(colnames):
            startcol = index + 1
            textrenderer = gtk.CellRendererText()
            tvcolumn = gtk.TreeViewColumn(self.colname2string[colname],
                                          textrenderer, text=startcol)
            tvcolumn.set_sizing(gtk.TREE_VIEW_COLUMN_AUTOSIZE)
            tvcolumn.set_clickable(True)
            tvcolumn.set_sort_column_id(sortid or startcol)
            self.treeview.append_column(tvcolumn)
        self._frame = self._build_parent_frame(_("Results"), self.treeview)
        self._frame.show_all()
        self._root.pack_start(self._frame, True, True, 0)

    def set_columns(self):
        columnsdic = {self.COL_COEF: config.get("columns.result-coef"),
                      self.COL_SPEED: config.get("columns.result-speed"),
                      self.COL_SECTOR: config.get("columns.result-sector"),
                      self.COL_TYPE: config.get("columns.result-type"),
                      self.COL_CATEGORY: config.get("columns.result-category"),
                      self.COL_WIND: config.get("columns.result-wind"),
                      self.COL_WINDSPEED: config.get("columns.result-windspeed"),
                      self.COL_WEATHER: config.get("columns.result-weather"),
                      self.COL_TEMPERATURE: config.get("columns.result-temperature"),
                      self.COL_COMMENT: config.get("columns.result-comment")}
        for key, value in columnsdic.items():
            self.treeview.get_column(key).set_visible(value)

    def fill_treeview(self):
        self.treeview.freeze_child_notify()
        self.treeview.set_model(None)
        self.liststore.set_default_sort_func(lambda *args: -1) 
        self.liststore.set_sort_column_id(-1, gtk.SORT_ASCENDING)

        self.clear()
        for result in database.get_all_results():
            placestr, coef, coefstr = common.format_place_coef(result["place"], result["out"])
            speed = common.format_speed(result["speed"])
            band, year = common.get_band_from_pindex(result["pindex"])

            self.liststore.insert(0,
                [result["Resultkey"], band, year, result["date"], result["point"],
                 placestr, result["out"], coefstr, speed, result["sector"], result["type"],
                 result["category"], result["wind"], result["windspeed"], result["weather"],
                 result["temperature"], result["comment"], result["place"], coef, result["speed"]
                ]
            )

        self.treeview.set_model(self.sortmodel)
        self.treeview.thaw_child_notify()
        self.liststore.set_sort_column_id(self.LS_COL_DATE, gtk.SORT_ASCENDING)

    def clear(self):
        self.liststore.clear()

    def refresh(self):
        self.selection.emit("changed")

    def refilter(self):
        self.filtermodel.refilter()

    def set_filter(self, filter1, filter2):
        self._filter = filter1 + filter2

    def update_filter(self):
        # Not used in this view
        pass

    def get_report_data(self, flatten=False):
        data = []
        for row in self.sortmodel:
            temp = {}
            for col in (self.LS_COL_BAND, self.LS_COL_YEAR, self.LS_COL_DATE,
                        self.LS_COL_RACEPOINT, self.LS_COL_PLACED, self.LS_COL_OUT,
                        self.LS_COL_COEF, self.LS_COL_SPEED, self.LS_COL_SECTOR,
                        self.LS_COL_TYPE, self.LS_COL_CATEGORY, self.LS_COL_WIND,
                        self.LS_COL_WINDSPEED, self.LS_COL_WEATHER, self.LS_COL_TEMPERATURE,
                        self.LS_COL_COMMENT, self.LS_COL_PLACEDINT, self.LS_COL_COEFFLOAT, 
                        self.LS_COL_SPEEDFLOAT):
                name = self.column2name[col]
                temp[name] = self.sortmodel.get_value(row.iter, col)
            temp["ring"] = "%s / %s" % (temp["band"], temp["year"][2:])
            data.append(temp)
        return data

    def _visible_func(self, model, treeiter):
        for item in self._filter:
            modelvalue = model.get_value(treeiter, item.name)
            if not item.operator(modelvalue, item.value):
                return False
        return True

    def _sort_func(self, model, iter1, iter2):
        data1 = model.get_value(iter1, self.LS_COL_YEAR)
        data2 = model.get_value(iter2, self.LS_COL_YEAR)
        if data1 == data2:
            data1 = model.get_value(iter1, self.LS_COL_BAND)
            data2 = model.get_value(iter2, self.LS_COL_BAND)
        return cmp(data1, data2)


class SplittedView(BaseView):
    ID = 1

    (LS_COL_KEY,
     LS_COL_DATE,
     LS_COL_RACEPOINT,
     LS_COL_TYPE,
     LS_COL_WIND,
     LS_COL_WINDSPEED,
     LS_COL_WEATHER,
     LS_COL_TEMPERATURE) = range(8)

    (LS_COL_BAND,
     LS_COL_YEAR,
     LS_COL_PLACED,
     LS_COL_OUT,
     LS_COL_COEF,
     LS_COL_SPEED,
     LS_COL_SECTOR,
     LS_COL_CATEGORY,
     LS_COL_COMMENT,
     LS_COL_PLACEDINT,
     LS_COL_COEFFLOAT,
     LS_COL_SPEEDFLOAT) = range(100, 112)

    (COL_DATE,
     COL_RACEPOINT,
     COL_TYPE,
     COL_WIND,
     COL_WINDSPEED,
     COL_WEATHER,
     COL_TEMPERATURE) = range(7)

    (COL_BAND,
     COL_YEAR,
     COL_PLACED,
     COL_OUT,
     COL_COEF,
     COL_SPEED,
     COL_SECTOR,
     COL_CATEGORY,
     COL_COMMENT) = range(9)

    def __init__(self, root):
        BaseView.__init__(self, root)

        self.results_cache = {}

    @property
    def maintree(self):
        return self.treeview

    def build_ui(self):
        self.race_ls = gtk.ListStore(int, str, str, str, str, str, str, str)
        self.race_filter = self.race_ls.filter_new()
        self.race_filter.set_visible_func(self._visible_races_func)
        self.race_sort = gtk.TreeModelSort(self.race_filter)
        self.race_tv = gtk.TreeView()
        self.race_tv.set_model(self.race_sort)
        self.race_tv.set_rules_hint(True)
        self.race_tv.set_enable_search(False)
        self.race_sel = self.race_tv.get_selection()
        self.race_sel.connect("changed", self.on_race_sel_changed)
        colnames = ["date", "point", "type", "wind", 
                    "windspeed", "weather", "temperature"]
        for index, colname in enumerate(colnames):
            startcol = index + 1
            textrenderer = gtk.CellRendererText()
            tvcolumn = gtk.TreeViewColumn(self.colname2string[colname],
                                          textrenderer, text=startcol)
            tvcolumn.set_sizing(gtk.TREE_VIEW_COLUMN_AUTOSIZE)
            tvcolumn.set_clickable(True)
            tvcolumn.set_sort_column_id(startcol)
            self.race_tv.append_column(tvcolumn)
        self._frame1 = self._build_parent_frame(_("Races"), self.race_tv)
        self._frame1.show_all()
        self._root.pack_start(self._frame1, True, True, 0)

        self.liststore = gtk.ListStore(str, str, str, int, str, str, str, str, str, int, float, float)
        self.treeview = gtk.TreeView()
        self.treeview.set_model(self.liststore)
        self.treeview.set_rules_hint(True)
        self.treeview.set_enable_search(False)
        self.selection = self.treeview.get_selection()
        colnames = [("band", None),("year", None),
                    ("place", self.LS_COL_PLACEDINT), ("out", None),
                    ("coef", self.LS_COL_COEFFLOAT),
                    ("speed", self.LS_COL_SPEEDFLOAT), ("sector", None),
                    ("category", None), ("comment", None)]
        for index, (colname, sortid) in enumerate(colnames):
            textrenderer = gtk.CellRendererText()
            tvcolumn = gtk.TreeViewColumn(self.colname2string[colname],
                                          textrenderer, text=index)
            tvcolumn.set_sizing(gtk.TREE_VIEW_COLUMN_AUTOSIZE)
            tvcolumn.set_clickable(True)
            tvcolumn.set_sort_column_id(sortid or index)
            self.treeview.append_column(tvcolumn)
        self._frame2 = self._build_parent_frame(_("Results"), self.treeview)
        self._frame2.show_all()
        self._root.pack_start(self._frame2, True, True, 0)

    def set_columns(self):
        columnsdic = {self.COL_COEF: config.get("columns.result-coef"),
                      self.COL_SPEED: config.get("columns.result-speed"),
                      self.COL_SECTOR: config.get("columns.result-sector"),
                      self.COL_CATEGORY: config.get("columns.result-category"),
                      self.COL_COMMENT: config.get("columns.result-comment")}
        for key, value in columnsdic.items():
            self.treeview.get_column(key).set_visible(value)

        columnsdic = {self.COL_TYPE: config.get("columns.result-type"),
                      self.COL_WIND: config.get("columns.result-wind"),
                      self.COL_WINDSPEED: config.get("columns.result-windspeed"),
                      self.COL_WEATHER: config.get("columns.result-weather"),
                      self.COL_TEMPERATURE: config.get("columns.result-temperature")}
        for key, value in columnsdic.items():
            self.race_tv.get_column(key).set_visible(value)

    def fill_treeview(self):
        self.clear()
        counter = 0
        for race in database.get_all_races():
            self.results_cache[counter] = {"results": [], "filtered": []}
            resultstmp = database.get_results_for_data({"date": race["date"], "point": race["point"]})
            for result in resultstmp:
                result = dict(result)
                band, year = common.get_band_from_pindex(result["pindex"])
                result["band"] = band
                result["year"] = year
                result["ring"] = "%s / %s" % (band, year[2:])

                placestr, coef, coefstr = common.format_place_coef(result["place"], result["out"])
                result["speedstr"] = common.format_speed(result["speed"])
                result["coef"] = coef
                result["coefstr"] = coefstr
                result["placestr"] = placestr

                self.results_cache[counter]["results"].append(result)
                self.results_cache[counter]["filtered"].append(result)

            self.race_ls.append([counter, race["date"], race["point"], race["type"],
                                          race["wind"], race["windspeed"],
                                          race["weather"], race["temperature"]])
            counter += 1

    def clear(self):
        self.liststore.clear()
        self.race_ls.clear()

    def refresh(self):
        self.race_sel.emit("changed")

    def refilter(self):
        self.race_filter.refilter()

        model, node = self.race_sel.get_selected()
        if node is None:
            self.race_sel.select_path(0)
        else:
            self.race_tv.scroll_to_cell(model.get_path(node))

    def set_filter(self, races, results):
        self._filter_races = races
        self._filter_results = results

    def update_filter(self):
        if not self._filter_results.has_filters():
            for result in self.results_cache.values():
                result["filtered"] = result["results"][:]
            return

        for row in self.race_ls:
            filtered = []
            race_key = self.race_ls.get_value(row.iter, self.LS_COL_KEY)
            for result in self.results_cache[race_key]["results"]:
                show = True
                for item in self._filter_results:
                    resultvalue = result[self.column2name[item.name]]
                    if not item.operator(item.type(resultvalue), item.type(item.value)):
                        show = False
                        break
                if show:
                    filtered.append(result)
            self.results_cache[race_key]["filtered"] = filtered

    def get_report_data(self, flatten=False):
        # data = [{"race": {}, "results": [{}]}]
        # data_flat = [{}]
        data = []
        for row in self.race_sort:
            temp = {"race": {}, "results": []}
            # Get the wanted columns for the race
            for col in (self.LS_COL_DATE, self.LS_COL_RACEPOINT, self.LS_COL_TYPE,
                        self.LS_COL_WIND, self.LS_COL_WEATHER, self.LS_COL_TEMPERATURE):
                name = self.column2name[col]
                temp["race"][name] = self.race_sort.get_value(row.iter, col)
            # Get the filtered results for the race
            race_key = self.race_sort.get_value(row.iter, self.LS_COL_KEY)
            temp["results"] = self.results_cache[race_key]["filtered"][:]
            data.append(temp)

        if flatten:
            tempdata = []
            for item in data:
                for result in item["results"]:
                    temp = result.copy()
                    temp.update(item["race"])
                    tempdata.append(temp)
            data = tempdata

        return data

    def on_race_sel_changed(self, selection):
        model, rowiter = selection.get_selected()
        if rowiter is None:
            return

        self.liststore.clear()
        key = model.get_value(rowiter, self.LS_COL_KEY)
        for result in self.results_cache[key]["filtered"]:
            self.liststore.append([result["band"], result["year"], result["placestr"], 
                                   result["out"], result["coefstr"], result["speedstr"], 
                                   result["sector"], result["category"], result["comment"],
                                   result["place"], result["coef"], result["speed"]])

    def _visible_races_func(self, model, treeiter):
        for item in self._filter_races:
            modelvalue = model.get_value(treeiter, item.name)
            if not item.operator(modelvalue, item.value):
                return False

        if not self._filter_results.has_filters():
            # No result filters
            return True

        race_key = self.race_ls.get_value(treeiter, self.LS_COL_KEY)
        return len(self.results_cache[race_key]["filtered"]) > 0


class ResultWindow(builder.GtkBuilder):
    ui = """
<ui>
   <toolbar name="Toolbar">
      <toolitem action="Export"/>
      <toolitem action="Save"/>
      <toolitem action="Mail"/>
      <separator/>
      <toolitem action="Preview"/>
      <toolitem action="Print"/>
      <separator/>
      <toolitem action="Filter"/>
      <separator/>
      <toolitem action="Close"/>
   </toolbar>
</ui>
"""
    def __init__(self, parent):
        builder.GtkBuilder.__init__(self, "ResultWindow.ui")

        filename = "%s_%s" % (_("Results"), datetime.date.today())
        self.pdfname = filename + ".pdf"
        self.csvname = filename + ".csv"
        self._filter_races = utils.TreeviewFilter()
        self._filter_results = utils.TreeviewFilter()

        self._build_toolbar()

        view = get_view_for_current_config()
        self.widgets.resultview = view(self.widgets.hbox)
        self.widgets.resultview.set_columns()
        self.widgets.resultview.set_filter(self._filter_races, self._filter_results)
        self.widgets.resultview.fill_treeview()

        self.widgets.combopoint.set_data(database.get_all_data(database.Tables.RACEPOINTS), sort=False, active=None)
        self.widgets.combosector.set_data(database.get_all_data(database.Tables.SECTORS), sort=False, active=None)
        self.widgets.combotype.set_data(database.get_all_data(database.Tables.TYPES), sort=False, active=None)
        self.widgets.combocategory.set_data(database.get_all_data(database.Tables.CATEGORIES), sort=False, active=None)
        self.widgets.comboweather.set_data(database.get_all_data(database.Tables.WEATHER), sort=False, active=None)
        self.widgets.combowind.set_data(database.get_all_data(database.Tables.WIND), sort=False, active=None)

        self.widgets.resultwindow.set_transient_for(parent)
        self.widgets.resultwindow.show()

    # Callbacks
    def on_close_window(self, widget, event=None):
        self.widgets.resultwindow.destroy()

    def on_close_filter(self, widget, event=None):
        self.widgets.filterdialog.hide()
        return True

    def on_filter_clicked(self, widget):
        self.widgets.filterdialog.show()

    def on_filterclear_clicked(self, widget):
        for combo in ["date", "year", "place", "out", "coef"]:
            getattr(self.widgets, "combo"+combo).set_active(0)
        for spin in ["year", "place", "out", "coef"]:
            getattr(self.widgets, "spin"+spin).set_value(0)
        for combo in ["point", "type", "wind", "weather", "sector", "category"]:
            getattr(self.widgets, "combo"+combo).child.set_text("")

        self.widgets.entrydate.set_text("")
        self.widgets.entryband.clear()
        self.widgets.checkclassified.set_active(False)

        self._filter_races.clear()
        self._filter_results.clear()
        self._save_filter_results()
        self.widgets.resultview.refilter()

    def on_filtersearch_clicked(self, widget):
        # Races filter
        self._filter_races.clear()
        try:
            date = self.widgets.entrydate.get_text()
        except errors.InvalidInputError:
            ErrorDialog(messages.MSG_INVALID_FORMAT, self.widgets.filterdialog)
            return
        dateop = self.widgets.combodate.get_operator()
        self._filter_races.add(self.widgets.resultview.LS_COL_DATE, date, dateop)

        point = self.widgets.combopoint.child.get_text()
        self._filter_races.add(self.widgets.resultview.LS_COL_RACEPOINT, point)

        ftype = self.widgets.combotype.child.get_text()
        self._filter_races.add(self.widgets.resultview.LS_COL_TYPE, ftype)

        wind = self.widgets.combowind.child.get_text()
        self._filter_races.add(self.widgets.resultview.LS_COL_WIND, wind)

        weather = self.widgets.comboweather.child.get_text()
        self._filter_races.add(self.widgets.resultview.LS_COL_WEATHER, weather)

        # Results filter
        self._filter_results.clear()
        try:
            pindex = self.widgets.entryband.get_pindex()
        except errors.InvalidInputError:
            ErrorDialog(messages.MSG_EMPTY_FIELDS, self.widgets.filterdialog)
            return
        if pindex:
            band, year = common.get_band_from_pindex(pindex)
            self._filter_results.add(self.widgets.resultview.LS_COL_BAND, band)
            self._filter_results.add(self.widgets.resultview.LS_COL_YEAR, year, type_=int)

        year = self.widgets.spinyear.get_value_as_int()
        yearop = self.widgets.comboyear.get_operator()
        self._filter_results.add(self.widgets.resultview.LS_COL_YEAR, year, yearop, int)

        place = self.widgets.spinplace.get_value_as_int()
        placeop = self.widgets.comboplace.get_operator()
        self._filter_results.add(self.widgets.resultview.LS_COL_PLACEDINT, place, placeop, int)

        out = self.widgets.spinout.get_value_as_int()
        outop = self.widgets.comboout.get_operator()
        self._filter_results.add(self.widgets.resultview.LS_COL_OUT, out, outop, int)

        coef = self.widgets.spincoef.get_value()
        coefop = self.widgets.combocoef.get_operator()
        self._filter_results.add(self.widgets.resultview.LS_COL_COEFFLOAT, coef, coefop, float)

        sector = self.widgets.combosector.child.get_text()
        self._filter_results.add(self.widgets.resultview.LS_COL_SECTOR, sector)

        category = self.widgets.combocategory.child.get_text()
        self._filter_results.add(self.widgets.resultview.LS_COL_CATEGORY, category)

        if self.widgets.checkclassified.get_active():
            self._filter_results.add(self.widgets.resultview.LS_COL_PLACEDINT, 0, operator.gt, int, True)

        self._save_filter_results()
        self.widgets.resultview.refilter()

    def on_spinbutton_output(self, widget):
        value = widget.get_value_as_int()
        text = "" if value == 0 else str(value)
        widget.set_text(text)
        return True

    def on_entryband_search_clicked(self, widget):
        return None, None, None

    def on_mail_clicked(self, widget):
        #TODO: disabled for now. Remove?
        ##self._do_operation(const.MAIL)
        ##results = os.path.join(const.TEMPDIR, self.pdfname)
        ##maildialog.MailDialog(self.resultwindow, results)
        pass

    def on_export_clicked(self, widget):
        chooser = ExportChooser(self.widgets.resultwindow, self.csvname, ("CSV", "*.csv"))
        response = chooser.run()
        if response == gtk.RESPONSE_OK:
            save_path = chooser.get_filename()
            data = self.widgets.resultview.get_report_data(flatten=True)
            columns = ["band", "year", "date", "point", "place", "out", "coef", "speed",
                       "sector", "type", "category", "wind", "windspeed", "weather",
                       "temperature", "comment"]
            with open(save_path, "wb") as output:
                writer = common.UnicodeWriter(output, fieldnames=columns,
                                              extrasaction="ignore")
                writer.writerow(dict((col, self.widgets.resultview.colname2string[col])
                                     for col in columns))
                writer.writerows(data)
        chooser.destroy()

    def on_save_clicked(self, widget):
        chooser = PdfSaver(self.widgets.resultwindow, self.pdfname)
        response = chooser.run()
        if response == gtk.RESPONSE_OK:
            save_path = chooser.get_filename()
            self._do_operation(PRINT_ACTION_EXPORT, save_path)
        chooser.destroy()

    def on_preview_clicked(self, widget):
        self._do_operation(PRINT_ACTION_PREVIEW)

    def on_print_clicked(self, widget):
        self._do_operation(PRINT_ACTION_DIALOG)

    # Private methods
    def _build_toolbar(self):
        uimanager = gtk.UIManager()
        uimanager.add_ui_from_string(self.ui)
        uimanager.insert_action_group(self.widgets.actiongroup, 0)
        accelgroup = uimanager.get_accel_group()
        self.widgets.resultwindow.add_accel_group(accelgroup)

        toolbar = uimanager.get_widget("/Toolbar")
        self.widgets.vbox.pack_start(toolbar, False, False)

    def _save_filter_results(self):
        self.widgets.resultview.set_filter(self._filter_races, self._filter_results)
        self.widgets.resultview.update_filter()
        self.widgets.resultview.refresh()

    def _do_operation(self, print_action, save_path=None):
        userinfo = common.get_own_address()
        if not tools.check_user_info(self.widgets.resultwindow, userinfo["name"]):
            return

        data = self.widgets.resultview.get_report_data()

        psize = common.get_pagesize_from_opts()
        opts = ResultsReportOptions(psize, None, print_action, save_path,
                                           parent=self.widgets.resultwindow)
        try:
            report(ResultsReport, opts, data, userinfo)
        except ReportError as exc:
            ErrorDialog((exc.value.split("\n")[0],
                         _("You probably don't have write permissions on this folder."),
                         _("Error"))
                    )

