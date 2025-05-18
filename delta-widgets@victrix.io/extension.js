// Description: This extension adds a digital clock and date to the bottom of the Dash to Dock panel.

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
const { Gio, GLib, Gtk, Meta, St, Clutter } = imports.gi;

function locate_dock() {
    const items = Main.layoutManager.uiGroup.get_children();
    for (const item of items) { if (item.name === "dashtodockContainer") { return item; } }
    return null;
} // end fn locate_dock()

// For debugging
function decycle(obj, stack = []) {
    if (!obj || typeof obj !== 'object') { return obj; }
    if (stack.includes(obj)) { return null; }
    let s = stack.concat([obj]);
    return Array.isArray(obj)
        ? obj.map(x => decycle(x, s))
        : Object.fromEntries(
            Object.entries(obj)
                .map(([k, v]) => [k, decycle(v, s)]));
} // end fn decycle

function battery_proxy_init () {
	return Gio.DBusProxy.new_sync(
		Gio.DBus.system,
		Gio.DBusProxyFlags.NONE,
		null,
		'org.freedesktop.UPower',
		'/org/freedesktop/UPower/devices/battery_BAT0',
		'org.freedesktop.UPower.Device',
		null
	);
}

function add_widgets() {

	let battery_proxy;
	let has_battery;
	let dock = locate_dock();
			
	// Calculate width and height
	let allocation = dock.get_allocation_box();
	let width = allocation.get_width();
	let height = allocation.get_height();
	let icon_size = dock.dash.iconSize;
	let widget_height = width;
	let padding = 10;
	let icon_size_padded = icon_size - padding * 2;

	function icon_placement(count) {
		return height - width * count + padding;
	}

	label_time = new St.Label({
		style_class: 'time-label',
		reactive: true,
		can_focus: true,
		track_hover: true,
		text: "...",
	});

	label_time.set_size(width, widget_height);
	label_time.set_position(0, icon_placement(2));
	dock.add_child(label_time);
	
	label_date = new St.Label({
		style_class: 'date-label',
		reactive: true,
		can_focus: true,
		track_hover: true,
		text: "...",
	});

	label_date.set_size(width, widget_height);
	label_date.set_position(0, icon_placement(3));
	dock.add_child(label_date);

	battery_proxy = battery_proxy_init();

	has_battery = battery_proxy.get_cached_property('IsPresent').unpack();

	if (has_battery) {
		label_battery = new St.Label({
			style_class: 'battery-label',
			reactive: true,
			can_focus: true,
			track_hover: true,
			text: "...",
		});
		label_battery.set_size(width, widget_height);
		label_battery.set_position(0, icon_placement(4));
		dock.add_child(label_battery);
		label_battery.connect('destroy', () => { label_battery = null; });
	}

	label_time.connect('destroy', () => {
		label_time = null;
	});
	
	label_date.connect('destroy', () => {
		label_date = null;
	});

}

export default class DeltaWidgetsExtension extends Extension {
	enable() {

		globalThis.label_time = null;
		globalThis.label_date = null;
		globalThis.label_battery = null;
		globalThis.battery_proxy = null;
		globalThis.exit = false;
		let percentage;

		GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {

			if (label_time !== null) {
				let date = new Date();
				let hours = date.getHours();
				let minutes = date.getMinutes();
				let seconds = date.getSeconds();
				let ampm = hours >= 12 ? "PM" : "AM";
				hours = hours % 12;
				hours = hours ? hours : 12;
				hours = hours < 10 ? "0" + hours : hours;
				minutes = minutes < 10 ? "0" + minutes : minutes;
				seconds = seconds < 10 ? "0" + seconds : seconds;
				let month = date.toLocaleString('default', { month: 'short' });
				let day = date.getDate();
				let year = date.getFullYear();
				let day_of_week = date.toLocaleString('default', { weekday: 'long' });
				label_time.set_text(`${hours}:${minutes}\n${seconds}:${ampm}\n`);
				label_date.set_text(`${month} / ${day}\n${year}\n${day_of_week}`);

				if (label_battery !== null) {
					if (battery_proxy == null) { battery_proxy = battery_proxy_init(); }
					percentage = battery_proxy.get_cached_property('Percentage').unpack();
					label_battery.set_text(`${Math.min(percentage+1, 100)}%`)
				}

				return !exit;
			} else if (!exit) { add_widgets(); }
			return !exit;
		});


	}

	disable() {
		exit = true;
		if (label_time != null) { label_time.destroy(); }
		if (label_date != null) { label_date.destroy(); }
		if (label_battery != null) { label_battery.destroy(); }
		label_time = null;
		label_date = null;
		label_battery = null;
	}
}
