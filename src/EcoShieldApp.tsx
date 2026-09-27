import React, { useState, useMemo } from "react";
import {
  Home as HomeIcon,
  LayoutGrid,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  RefreshCw,
  Trash2,
  ThermometerSun,
  ThermometerSnowflake,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RATE_PER_UNIT = 55; // PKR per electricity unit, editable in settings later

function jitter(value, spread) {
  return Math.round((value + (Math.random() - 0.5) * spread) * 10) / 10;
}

function genHistory(outside, avgInside) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((d) => ({
    day: d,
    outside: jitter(outside, 3),
    inside: jitter(avgInside, 1.5),
  }));
}

export default function EcoShieldApp() {
  const [screen, setScreen] = useState("home");
  const [outsideTemp, setOutsideTemp] = useState(46);
  const [monthlyBill, setMonthlyBill] = useState(9500);
  const [rooms, setRooms] = useState([
    { id: 1, name: "Living Room", temp: 29 },
    { id: 2, name: "Bedroom 1", temp: 28 },
    { id: 3, name: "Bedroom 2", temp: 30 },
    { id: 4, name: "Kitchen", temp: 31 },
  ]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomTemp, setNewRoomTemp] = useState(29);

  const avgInside = useMemo(() => {
    if (rooms.length === 0) return outsideTemp;
    return rooms.reduce((s, r) => s + r.temp, 0) / rooms.length;
  }, [rooms, outsideTemp]);

  const blockedPct = useMemo(() => {
    const idealInside = 24;
    const raw =
      ((outsideTemp - avgInside) / (outsideTemp - idealInside)) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }, [outsideTemp, avgInside]);

  const savings = useMemo(() => {
    const unitsSaved = Math.round((blockedPct / 100) * 0.65 * (monthlyBill / RATE_PER_UNIT));
    const pkrSaved = unitsSaved * RATE_PER_UNIT;
    return { unitsSaved, pkrSaved };
  }, [blockedPct, monthlyBill]);

  const history = useMemo(() => genHistory(outsideTemp, avgInside), [outsideTemp, avgInside]);

  function refreshReading() {
    setOutsideTemp((t) => jitter(t, 1.5));
    setRooms((rs) => rs.map((r) => ({ ...r, temp: jitter(r.temp, 0.8) })));
  }

  function updateRoomTemp(id, temp) {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, temp } : r)));
  }

  function removeRoom(id) {
    setRooms((rs) => rs.filter((r) => r.id !== id));
  }

  function addRoom() {
    if (!newRoomName.trim()) return;
    setRooms((rs) => [
      ...rs,
      { id: Date.now(), name: newRoomName.trim(), temp: Number(newRoomTemp) || 28 },
    ]);
    setNewRoomName("");
    setNewRoomTemp(29);
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-sm bg-stone-900 rounded-[2.5rem] border border-stone-800 shadow-2xl overflow-hidden">
        {/* status bar */}
        <div className="flex justify-between items-center px-6 pt-5 text-xs font-mono text-stone-400">
          <span>9:41</span>
          <span>Model Town, Lahore · {outsideTemp}°C</span>
        </div>

        {/* content */}
        <div className="px-5 pt-4 pb-3 min-h-[640px] flex flex-col gap-5">
          {screen === "home" && (
            <HomeScreen
              outsideTemp={outsideTemp}
              avgInside={avgInside}
              blockedPct={blockedPct}
              savings={savings}
              rooms={rooms}
              onRefresh={refreshReading}
            />
          )}
          {screen === "rooms" && (
            <RoomsScreen
              rooms={rooms}
              onUpdate={updateRoomTemp}
              onRemove={removeRoom}
              newRoomName={newRoomName}
              setNewRoomName={setNewRoomName}
              newRoomTemp={newRoomTemp}
              setNewRoomTemp={setNewRoomTemp}
              onAdd={addRoom}
            />
          )}
          {screen === "reports" && (
            <ReportsScreen history={history} savings={savings} />
          )}
          {screen === "settings" && (
            <SettingsScreen
              monthlyBill={monthlyBill}
              setMonthlyBill={setMonthlyBill}
              outsideTemp={outsideTemp}
              setOutsideTemp={setOutsideTemp}
            />
          )}

          {/* bottom nav */}
          <div className="mt-auto pt-3 border-t border-stone-800 flex justify-around">
            <NavButton
              icon={<HomeIcon size={20} />}
              label="Home"
              active={screen === "home"}
              onClick={() => setScreen("home")}
            />
            <NavButton
              icon={<LayoutGrid size={20} />}
              label="Rooms"
              active={screen === "rooms"}
              onClick={() => setScreen("rooms")}
            />
            <NavButton
              icon={<BarChart3 size={20} />}
              label="Reports"
              active={screen === "reports"}
              onClick={() => setScreen("reports")}
            />
            <NavButton
              icon={<SettingsIcon size={20} />}
              label="Settings"
              active={screen === "settings"}
              onClick={() => setScreen("settings")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 ${
        active ? "text-emerald-400" : "text-stone-500"
      }`}
    >
      {icon}
      <span className="text-[10px] font-mono tracking-wide">{label}</span>
    </button>
  );
}

function HomeScreen({ outsideTemp, avgInside, blockedPct, savings, rooms, onRefresh }) {
  return (
    <>
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-1">
          Good evening
        </p>
        <h1 className="font-serif text-2xl text-stone-100 leading-snug">
          Your home is staying {Math.max(0, Math.round(outsideTemp - avgInside))}° cooler today
        </h1>
        <div className="text-xs text-stone-400 mt-1">
          Retrofit installed · {rooms.length} room{rooms.length !== 1 ? "s" : ""} monitored
        </div>
      </div>

      {/* hero */}
      <div className="bg-stone-800/60 border border-stone-700 rounded-2xl p-4">
        <div className="flex justify-between text-[11px] font-mono uppercase tracking-wide text-stone-400 mb-3">
          <span>Outside</span>
          <span>BioPanel</span>
          <span>Inside</span>
        </div>
        <div className="flex h-24 rounded-xl overflow-hidden">
          <div className="w-[34%] bg-gradient-to-r from-orange-900 to-orange-700 relative">
            <span className="absolute top-2 left-2 font-mono font-semibold text-white text-sm">
              {outsideTemp}°C
            </span>
            <span className="absolute bottom-2 left-2 text-[9px] uppercase text-white/70 font-mono">
              Brick + sun
            </span>
          </div>
          <div className="w-[14%] bg-amber-700/70 border-x-2 border-amber-900 flex items-center justify-center">
            <span className="text-[8px] uppercase tracking-widest text-amber-950 font-mono -rotate-90 whitespace-nowrap">
              straw · mycelium
            </span>
          </div>
          <div className="w-[52%] bg-gradient-to-r from-emerald-900 to-emerald-800 relative">
            <span className="absolute top-2 left-2 font-mono font-semibold text-white text-sm">
              {avgInside.toFixed(1)}°C
            </span>
            <span className="absolute bottom-2 left-2 text-[9px] uppercase text-white/70 font-mono">
              Avg. inside
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-4">
          <span className="font-serif font-semibold text-4xl text-emerald-400">
            {blockedPct}%
          </span>
          <span className="text-sm text-stone-400 pb-1">
            of incoming heat blocked today
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="mt-3 flex items-center gap-1.5 text-xs font-mono text-stone-400 hover:text-emerald-400 transition-colors"
        >
          <RefreshCw size={13} /> Refresh sensor reading
        </button>
      </div>

      {/* temp cards */}
      <div className="flex gap-3">
        <div className="flex-1 bg-stone-800/60 border border-stone-700 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase text-orange-300 mb-2">
            <ThermometerSun size={13} /> Outside
          </div>
          <div className="font-mono text-2xl text-stone-100 font-semibold">{outsideTemp}°C</div>
        </div>
        <div className="flex-1 bg-stone-800/60 border border-stone-700 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase text-emerald-300 mb-2">
            <ThermometerSnowflake size={13} /> Inside avg.
          </div>
          <div className="font-mono text-2xl text-stone-100 font-semibold">{avgInside.toFixed(1)}°C</div>
        </div>
      </div>

      {/* savings */}
      <div className="bg-gradient-to-br from-emerald-950 to-stone-800 border border-emerald-900 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <div className="text-[10.5px] font-mono uppercase tracking-wide text-stone-400 mb-1">
            This month's savings
          </div>
          <div className="font-serif text-2xl text-emerald-400 font-semibold">
            PKR {savings.pkrSaved.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">vs. your pre-retrofit baseline</div>
        </div>
        <div className="text-right">
          <div className="font-serif text-lg text-emerald-400 font-semibold">
            {savings.unitsSaved} units
          </div>
          <div className="text-[11px] text-stone-500">electricity saved</div>
        </div>
      </div>
    </>
  );
}

function RoomsScreen({ rooms, onUpdate, onRemove, newRoomName, setNewRoomName, newRoomTemp, setNewRoomTemp, onAdd }) {
  return (
    <>
      <h1 className="font-serif text-2xl text-stone-100">Rooms</h1>
      <div className="flex flex-col gap-3">
        {rooms.map((r) => (
          <div key={r.id} className="bg-stone-800/60 border border-stone-700 rounded-xl p-3.5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-stone-100 font-medium">{r.name}</span>
              <button onClick={() => onRemove(r.id)} className="text-stone-500 hover:text-orange-400">
                <Trash2 size={15} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="20"
                max="40"
                step="0.5"
                value={r.temp}
                onChange={(e) => onUpdate(r.id, Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="font-mono text-sm text-emerald-400 w-14 text-right">{r.temp}°C</span>
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="text-sm text-stone-500 text-center py-6">
            No rooms yet — add your first one below.
          </div>
        )}
      </div>

      <div className="bg-stone-800/40 border border-dashed border-stone-700 rounded-xl p-3.5 flex flex-col gap-2.5">
        <span className="text-xs font-mono uppercase text-stone-400">Add a room</span>
        <input
          type="text"
          placeholder="Room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-500 outline-none focus:border-emerald-600"
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={newRoomTemp}
            onChange={(e) => setNewRoomTemp(e.target.value)}
            className="w-20 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 outline-none focus:border-emerald-600"
          />
          <span className="text-xs text-stone-500">°C starting reading</span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 transition-colors text-white text-sm font-medium rounded-lg py-2 mt-1"
        >
          <Plus size={15} /> Add room
        </button>
      </div>
    </>
  );
}

function ReportsScreen({ history, savings }) {
  return (
    <>
      <h1 className="font-serif text-2xl text-stone-100">Reports</h1>
      <div className="bg-stone-800/60 border border-stone-700 rounded-2xl p-4">
        <div className="text-xs font-mono uppercase text-stone-400 mb-3">
          Outside vs. inside — last 7 days
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={history} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a362c" />
            <XAxis dataKey="day" tick={{ fill: "#a39c8c", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#a39c8c", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#1c1a16", border: "1px solid #3a362c", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#f2ede2" }}
            />
            <Line type="monotone" dataKey="outside" stroke="#f0a45a" strokeWidth={2} dot={false} name="Outside" />
            <Line type="monotone" dataKey="inside" stroke="#55a67c" strokeWidth={2} dot={false} name="Inside" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-stone-800/60 border border-stone-700 rounded-2xl p-4">
        <div className="text-xs font-mono uppercase text-stone-400 mb-2">Estimated savings to date</div>
        <div className="flex justify-between items-end">
          <div>
            <div className="font-serif text-2xl text-emerald-400 font-semibold">
              PKR {(savings.pkrSaved * 3).toLocaleString()}
            </div>
            <div className="text-[11px] text-stone-500">since installation (3 months)</div>
          </div>
          <div className="text-right">
            <div className="font-serif text-lg text-emerald-400 font-semibold">
              {savings.unitsSaved * 3} units
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-stone-500 leading-relaxed">
        Figures are estimates based on your room sensor readings and the average electricity rate entered in Settings.
      </p>
    </>
  );
}

function SettingsScreen({ monthlyBill, setMonthlyBill, outsideTemp, setOutsideTemp }) {
  return (
    <>
      <h1 className="font-serif text-2xl text-stone-100">Settings</h1>

      <div className="bg-stone-800/60 border border-stone-700 rounded-xl p-4 flex flex-col gap-2">
        <label className="text-xs font-mono uppercase text-stone-400">
          Average monthly electricity bill (PKR)
        </label>
        <input
          type="number"
          value={monthlyBill}
          onChange={(e) => setMonthlyBill(Number(e.target.value))}
          className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 outline-none focus:border-emerald-600"
        />
        <p className="text-[11px] text-stone-500">Used to estimate your savings in rupees.</p>
      </div>

      <div className="bg-stone-800/60 border border-stone-700 rounded-xl p-4 flex flex-col gap-2">
        <label className="text-xs font-mono uppercase text-stone-400">
          Outside temperature override (°C)
        </label>
        <input
          type="number"
          value={outsideTemp}
          onChange={(e) => setOutsideTemp(Number(e.target.value))}
          className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 outline-none focus:border-emerald-600"
        />
        <p className="text-[11px] text-stone-500">
          In the full version, this comes automatically from your outdoor sensor.
        </p>
      </div>

      <div className="bg-stone-800/40 border border-dashed border-stone-700 rounded-xl p-4">
        <p className="text-xs text-stone-400 leading-relaxed">
          This is a working demo. Room and outdoor temperatures are entered here manually or nudged
          with "Refresh sensor reading" — in the production app, they will update automatically from
          the ESP32 + DHT22 sensors installed with your retrofit.
        </p>
      </div>
    </>
  );
}
