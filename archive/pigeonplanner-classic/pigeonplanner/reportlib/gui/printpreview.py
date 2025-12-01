# -*- coding: utf-8 -*-

from math import radians
from gettext import gettext as _

import gtk


PRINTER_DPI = 72.0

MARGIN = 6

(ZOOM_BEST_FIT,
 ZOOM_FIT_WIDTH,
 ZOOM_FREE,) = range(3)


class PrintPreview(gtk.Window):
    zoom_factors = {
        0.50: '50%',
        0.75: '75%',
        1.00: '100%',
        1.25: '125%',
        1.50: '150%',
        1.75: '175%',
        2.00: '200%',
        3.00: '300%',
        4.00: '400%',
    }

    def __init__(self, operation, preview, context, parent=None):
        gtk.Window.__init__(self)
        self.connect('delete-event', self.on_window_delete_event)
        self.set_transient_for(parent)
        self.set_title(_("Print Preview"))
        self.resize(800, 600)
        self.set_position(gtk.WIN_POS_CENTER)
        self.set_modal(True)

        self._operation = operation
        self._preview = preview
        self._context = context

        self._drawing_area = gtk.DrawingArea()
        self._drawing_area.connect('expose-event', self.on_drawingarea_expose_event)
        self._swin = gtk.ScrolledWindow()
        self._swin.connect('size-allocate', self.on_swin_size_allocate)
        self._swin.set_policy(gtk.POLICY_AUTOMATIC, gtk.POLICY_AUTOMATIC)
        self._swin.add_with_viewport(self._drawing_area)
        self._vbox = gtk.VBox()
        self._vbox.pack_end(self._swin)
        self.add(self._vbox)

        self.__build_toolbar()
        self._current_page = None

    def __build_toolbar(self):
        toolbar = gtk.Toolbar()
        toolbar.set_style(gtk.TOOLBAR_ICONS)
        self._vbox.pack_start(toolbar, False, False)

        # General
        quit = gtk.ToolButton(gtk.STOCK_CLOSE)
        quit.connect("clicked", self.on_quit_clicked)
        quit.set_tooltip_text(_("Close this window"))
        toolbar.insert(quit, -1)
        seperator = gtk.SeparatorToolItem()
        toolbar.insert(seperator, -1)

        # Navigation
        self._first_button = gtk.ToolButton(gtk.STOCK_GOTO_FIRST)
        self._first_button.connect("clicked", self.on_first_clicked)
        self._first_button.set_tooltip_text(_("Shows the first page"))
        toolbar.insert(self._first_button, -1)
        self._prev_button = gtk.ToolButton(gtk.STOCK_GO_BACK)
        self._prev_button.connect("clicked", self.on_prev_clicked)
        self._prev_button.set_tooltip_text(_("Shows previous page"))
        toolbar.insert(self._prev_button, -1)
        self._next_button = gtk.ToolButton(gtk.STOCK_GO_FORWARD)
        self._next_button.connect("clicked", self.on_next_clicked)
        self._next_button.set_tooltip_text(_("Shows the next page"))
        toolbar.insert(self._next_button, -1)
        self._last_button = gtk.ToolButton(gtk.STOCK_GOTO_LAST)
        self._last_button.connect("clicked", self.on_last_clicked)
        self._last_button.set_tooltip_text(_("Shows the last page"))
        toolbar.insert(self._last_button, -1)
        seperator = gtk.SeparatorToolItem()
        toolbar.insert(seperator, -1)

        # Pages
        self._pages_entry = gtk.Entry()
        self._pages_entry.connect("activate", self.on_entry_activate)
        self._pages_entry.set_width_chars(6)
        self._pages_label = gtk.Label("of 8")
        hbox = gtk.HBox(False, 6)
        hbox.pack_start(self._pages_entry, False, True, 0)
        hbox.pack_start(self._pages_label, False, True, 0)
        toolitem = gtk.ToolItem()
        toolitem.add(hbox)
        toolbar.insert(toolitem, -1)
        seperator = gtk.SeparatorToolItem()
        toolbar.insert(seperator, -1)

        # Zooming
        #TODO: needs different image
        self._zoom_fit_width_button = gtk.ToggleToolButton(gtk.STOCK_ZOOM_FIT)
        self._zoom_fit_width_button.connect("toggled", self.on_zoom_fit_width_toggled)
        self._zoom_fit_width_button.set_tooltip_text(_("Zooms to fit the page width"))
        toolbar.insert(self._zoom_fit_width_button, -1)
        self._zoom_best_fit_button = gtk.ToggleToolButton(gtk.STOCK_ZOOM_FIT)
        self._zoom_best_fit_button.connect("toggled", self.on_zoom_best_fit_toggled)
        self._zoom_best_fit_button.set_tooltip_text(_("Zooms to fit the whole page"))
        toolbar.insert(self._zoom_best_fit_button, -1)
        self._zoom_in_button = gtk.ToolButton(gtk.STOCK_ZOOM_IN)
        self._zoom_in_button.connect("clicked", self.on_zoom_in_clicked)
        self._zoom_in_button.set_tooltip_text(_("Zooms the page in"))
        toolbar.insert(self._zoom_in_button, -1)
        self._zoom_out_button = gtk.ToolButton(gtk.STOCK_ZOOM_OUT)
        self._zoom_out_button.connect("clicked", self.on_zoom_out_clicked)
        self._zoom_out_button.set_tooltip_text(_("Zooms the page out"))
        toolbar.insert(self._zoom_out_button, -1)

    def __set_page(self, page_no):
        if page_no < 0 or page_no >= self._page_no:
            return
        
        if self._current_page != page_no:
            self._drawing_area.queue_draw()
        
        self._current_page = page_no

        self._first_button.set_sensitive(self._current_page)
        self._prev_button.set_sensitive(self._current_page)
        self._next_button.set_sensitive(self._current_page < self._page_no - 1)
        self._last_button.set_sensitive(self._current_page < self._page_no - 1)
        
        self._pages_entry.set_text('%d' % (self._current_page + 1))
        
    def __set_zoom(self, zoom):
        self._zoom = zoom

        screen_width = int(self._paper_width * self._zoom + 2 * MARGIN)
        screen_height = int(self._paper_height * self._zoom + 2 * MARGIN)
        self._drawing_area.set_size_request(screen_width, screen_height)
        self._drawing_area.queue_draw()
        
        self._zoom_in_button.set_sensitive(self._zoom !=
                                           max(self.zoom_factors))
        self._zoom_out_button.set_sensitive(self._zoom !=
                                            min(self.zoom_factors))
        
    def __zoom_in(self):
        zoom = [z for z in self.zoom_factors if z > self._zoom]

        if zoom:
            return min(zoom)
        else:
            return self._zoom
            
    def __zoom_out(self):
        zoom = [z for z in self.zoom_factors if z < self._zoom]
        
        if zoom:
            return max(zoom)
        else:
            return self._zoom

    def __zoom_fit_width(self):
        width, height, vsb_w, hsb_h = self.__get_view_size()

        zoom = width / self._paper_width
        if self._paper_height * zoom > height:
            zoom = (width - vsb_w) / self._paper_width

        return zoom

    def __zoom_best_fit(self):
        width, height, vsb_w, hsb_h = self.__get_view_size()

        zoom = min(width / self._paper_width, height / self._paper_height)

        return zoom
        
    def __get_view_size(self):
        """Get the dimensions of the scrolled window.
        """
        width = self._swin.allocation.width - 2 * MARGIN
        height = self._swin.allocation.height - 2 * MARGIN

        if self._swin.get_shadow_type() != gtk.SHADOW_NONE:
            width -= 2 * self._swin.style.xthickness
            height -= 2 * self._swin.style.ythickness

        spacing = self._swin.style_get_property('scrollbar-spacing')
        
        vsb_w, vsb_h = self._swin.get_vscrollbar().size_request()
        vsb_w += spacing
        
        hsb_w, hsb_h = self._swin.get_hscrollbar().size_request()
        hsb_h += spacing
        
        return width, height, vsb_w, hsb_h
        
    def __end_preview(self):
        self._operation.end_preview()

    # Signal handlers
    
    def on_drawingarea_expose_event(self, drawing_area, event):
        cr = drawing_area.window.cairo_create()
        cr.rectangle(event.area)
        cr.clip()
        
        # get the extents of the page and the screen
        paper_w = int(self._paper_width * self._zoom)
        paper_h = int(self._paper_height * self._zoom)

        width, height, vsb_w, hsb_h = self.__get_view_size()
        if paper_h > height:
            width -= vsb_w
        if paper_w > width:
            height -= hsb_h
        
        # put the paper on the middle of the window
        xtranslate = MARGIN
        if  paper_w < width:
            xtranslate += (width - paper_w) / 2
            
        ytranslate = MARGIN
        if  paper_h < height:
            ytranslate += (height - paper_h) / 2
            
        cr.translate(xtranslate, ytranslate)
        
        # draw an empty white page
        cr.set_source_rgb(1.0, 1.0, 1.0)
        cr.rectangle(0, 0, paper_w, paper_h)
        cr.fill_preserve()
        cr.set_source_rgb(0, 0, 0)
        cr.set_line_width(1)
        cr.stroke()
        
        if self._orientation == gtk.PAGE_ORIENTATION_LANDSCAPE:
            ##cr.rotate(radians(-90))
            ##cr.translate(-paper_h, 0)
            cr.rotate(radians(90))
            cr.translate(0, -paper_w)
            
        ##page_setup = self._context.get_page_setup()
        ##cr.translate(page_setup.get_left_margin(gtk.UNIT_POINTS),
                     ##page_setup.get_top_margin(gtk.UNIT_POINTS))
        
        ##cr.set_source_surface(self.get_page(0))
        ##cr.paint()
        
        # draw the content of the currently selected page
        #     Here we use dpi scaling instead of scaling the cairo context,
        #     because it gives better result. In the latter case the distance
        #     of glyphs was changing.
        dpi = PRINTER_DPI * self._zoom
        self._context.set_cairo_context(cr, dpi, dpi)
        self._preview.render_page(self._current_page)
    
    def on_swin_size_allocate(self, scrolledwindow, allocation):
        if self._zoom_mode == ZOOM_FIT_WIDTH:
            self.__set_zoom(self.__zoom_fit_width())
        
        if self._zoom_mode == ZOOM_BEST_FIT:
            self.__set_zoom(self.__zoom_best_fit())

    def on_print_clicked(self, toolbutton):
        pass
    
    def on_first_clicked(self, toolbutton):
        self.__set_page(0)
    
    def on_prev_clicked(self, toolbutton):
        self.__set_page(self._current_page - 1)
    
    def on_next_clicked(self, toolbutton):
        self.__set_page(self._current_page + 1)
    
    def on_last_clicked(self, toolbutton):
        self.__set_page(self._page_no - 1)
    
    def on_entry_activate(self, entry):
        try:
            new_page = int(entry.get_text()) - 1
        except ValueError:
            new_page = self._current_page
        
        if new_page < 0 or new_page >= self._page_no:
            new_page = self._current_page
            
        self.__set_page(new_page)
        
    def on_zoom_fit_width_toggled(self, toggletoolbutton):
        if toggletoolbutton.get_active():
            self._zoom_best_fit_button.set_active(False)
            self._zoom_mode = ZOOM_FIT_WIDTH
            self.__set_zoom(self.__zoom_fit_width())
        else:
            self._zoom_mode = ZOOM_FREE
        
    def on_zoom_best_fit_toggled(self, toggletoolbutton):
        if toggletoolbutton.get_active():
            self._zoom_fit_width_button.set_active(False)
            self._zoom_mode = ZOOM_BEST_FIT
            self.__set_zoom(self.__zoom_best_fit())
        else:
            self._zoom_mode = ZOOM_FREE

    def on_zoom_in_clicked(self, toolbutton):
        self._zoom_fit_width_button.set_active(False)
        self._zoom_best_fit_button.set_active(False)
        self._zoom_mode = ZOOM_FREE
        self.__set_zoom(self.__zoom_in())
    
    def on_zoom_out_clicked(self, toolbutton):
        self._zoom_fit_width_button.set_active(False)
        self._zoom_best_fit_button.set_active(False)
        self._zoom_mode = ZOOM_FREE
        self.__set_zoom(self.__zoom_out())
        
    def on_window_delete_event(self, widget, event):
        self.__end_preview()
        return False

    def on_quit_clicked(self, toolbutton):
        self.__end_preview()
        self.destroy()

    # Public

    def start(self):
        # get paper/page dimensions
        page_setup = self._context.get_page_setup()
        self._paper_width = page_setup.get_paper_width(gtk.UNIT_POINTS)
        self._paper_height = page_setup.get_paper_height(gtk.UNIT_POINTS)
        self._page_width = page_setup.get_page_width(gtk.UNIT_POINTS)
        self._page_height = page_setup.get_page_height(gtk.UNIT_POINTS)
        self._orientation = page_setup.get_orientation()

        # get the total number of pages
        ##self._page_numbers = [0,]
        ##self._page_surfaces = {}
        self._page_no = self._operation.get_property('n_pages')
        self._pages_label.set_text(_('of %d') % self._page_no)

        # set zoom level and initial page number
        self._zoom_mode = ZOOM_FREE
        self.__set_zoom(1.0)
        self.__set_page(0)
        
        # let's the show begin...
        self.show_all()

