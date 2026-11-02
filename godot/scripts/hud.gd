extends CanvasLayer
## Interface: year and age, time controls, graphics quality, the chronicle, and a panel for the
## nation you click on.

var main
var year_lbl: Label
var info_lbl: Label
var log_box: VBoxContainer
var nation_panel: PanelContainer
var nation_lbl: RichTextLabel
var speed_btns: Array[Button] = []
var _sel := -1
var _sel_tile := -1


func _panel_style() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.07, 0.065, 0.06, 0.82)
	s.border_color = Color(1, 1, 1, 0.08)
	s.set_border_width_all(1)
	s.set_corner_radius_all(8)
	s.content_margin_left = 14
	s.content_margin_right = 14
	s.content_margin_top = 8
	s.content_margin_bottom = 8
	return s


func setup(m) -> void:
	main = m
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	# top bar
	var top := PanelContainer.new()
	top.add_theme_stylebox_override("panel", _panel_style())
	top.position = Vector2(12, 12)
	root.add_child(top)
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 14)
	top.add_child(hb)
	var title := Label.new()
	title.text = "FAITHBOUND"
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(0.93, 0.8, 0.55))
	hb.add_child(title)
	year_lbl = Label.new()
	year_lbl.add_theme_font_size_override("font_size", 17)
	hb.add_child(year_lbl)
	info_lbl = Label.new()
	info_lbl.add_theme_color_override("font_color", Color(0.78, 0.76, 0.72))
	hb.add_child(info_lbl)
	hb.add_child(VSeparator.new())
	var names := ["Pause", "1x", "4x", "15x"]
	for i in names.size():
		var b := Button.new()
		b.text = names[i]
		b.toggle_mode = true
		b.focus_mode = Control.FOCUS_NONE
		b.pressed.connect(func(): main.set_speed(i))
		hb.add_child(b)
		speed_btns.append(b)
	var skip := Button.new()
	skip.text = "Skip 100 years"
	skip.focus_mode = Control.FOCUS_NONE
	skip.pressed.connect(func(): main.skip_years(100))
	hb.add_child(skip)
	hb.add_child(VSeparator.new())
	var ql := Label.new()
	ql.text = "Graphics"
	hb.add_child(ql)
	var q := OptionButton.new()
	q.focus_mode = Control.FOCUS_NONE
	for s in ["Low", "Medium", "High", "Ultra"]:
		q.add_item(s)
	q.selected = main.quality
	q.item_selected.connect(func(i): main.apply_quality(i))
	hb.add_child(q)

	# chronicle
	var lp := PanelContainer.new()
	lp.add_theme_stylebox_override("panel", _panel_style())
	lp.anchor_top = 1.0
	lp.anchor_bottom = 1.0
	lp.offset_left = 12
	lp.offset_top = -200
	lp.offset_bottom = -12
	lp.offset_right = 520
	root.add_child(lp)
	log_box = VBoxContainer.new()
	log_box.add_theme_constant_override("separation", 2)
	lp.add_child(log_box)

	# nation panel
	nation_panel = PanelContainer.new()
	nation_panel.add_theme_stylebox_override("panel", _panel_style())
	nation_panel.anchor_left = 1.0
	nation_panel.anchor_right = 1.0
	nation_panel.offset_left = -330
	nation_panel.offset_right = -12
	nation_panel.offset_top = 12
	nation_panel.offset_bottom = 320
	nation_panel.visible = false
	root.add_child(nation_panel)
	nation_lbl = RichTextLabel.new()
	nation_lbl.bbcode_enabled = true
	nation_lbl.fit_content = true
	nation_lbl.custom_minimum_size = Vector2(290, 120)
	nation_panel.add_child(nation_lbl)

	# controls hint
	var help := Label.new()
	help.text = "WASD move · wheel zoom · right-drag or Q/E turn · middle-drag pan · click a land · Space pause · F12 screenshot"
	help.add_theme_color_override("font_color", Color(1, 1, 1, 0.55))
	help.add_theme_font_size_override("font_size", 13)
	help.anchor_left = 1.0
	help.anchor_right = 1.0
	help.anchor_top = 1.0
	help.anchor_bottom = 1.0
	help.offset_left = -760
	help.offset_right = -14
	help.offset_top = -30
	help.offset_bottom = -10
	help.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	root.add_child(help)


func refresh() -> void:
	var sim = main.sim
	year_lbl.text = "Year %d" % sim.year
	var alive := 0
	for n in sim.nations:
		if n["alive"]:
			alive += 1
	info_lbl.text = "%s · %d nations · %s people" % [sim.ERAS[sim.top_era()]["name"], alive, _fmt(sim.total_pop() * 10.0)]
	for i in speed_btns.size():
		speed_btns[i].button_pressed = i == main.speed
	if _sel >= 0 and Engine.get_process_frames() % 30 == 0:
		show_nation(_sel, _sel_tile)


func _fmt(v: float) -> String:
	if v >= 1e6:
		return "%.1fM" % (v / 1e6)
	if v >= 1e3:
		return "%.1fk" % (v / 1e3)
	return str(int(v))


func add_log(t: String) -> void:
	var l := Label.new()
	l.text = t
	l.add_theme_font_size_override("font_size", 13)
	l.add_theme_color_override("font_color", Color(0.86, 0.84, 0.8))
	log_box.add_child(l)
	log_box.move_child(l, 0)
	while log_box.get_child_count() > 8:
		var c := log_box.get_child(log_box.get_child_count() - 1)
		log_box.remove_child(c)
		c.queue_free()


func show_nation(id: int, tile: int) -> void:
	_sel = id
	_sel_tile = tile
	var sim = main.sim
	var w = main.world
	var land := ""
	if tile >= 0:
		land = "%s%s" % [w.BIOME_NAMES[w.biome[tile]], " with a river" if w.river_tile[tile] else ""]
	if id < 0:
		nation_lbl.text = "[b]Unclaimed land[/b]\n%s" % land
		nation_panel.visible = tile >= 0
		return
	var n: Dictionary = sim.nations[id]
	var col: Color = n["color"]
	var wars := []
	for f in n["wars"].keys():
		wars.append(sim.nations[f]["name"])
	var towns := []
	for c in n["cities"]:
		towns.append(c["name"])
	var t := "[font_size=20][color=#%s]■[/color] [b]%s[/b][/font_size]\n" % [col.to_html(false), n["name"]]
	t += "%s%s\n\n" % [sim.ERAS[n["era"]]["name"], "" if n["alive"] else " · fallen"]
	t += "People: %s\nLand: %d km²\nTowns: %s\n" % [_fmt(n["pop"] * 10.0), int(n["tiles"] * 1.6), ", ".join(towns.slice(0, 8))]
	t += "At war with: %s\n" % (", ".join(wars) if not wars.is_empty() else "no one")
	t += "\n[color=#aaa]%s[/color]" % land
	nation_lbl.text = t
	nation_panel.visible = true
