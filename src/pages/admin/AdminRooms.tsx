import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import type { Room, RoomStatus } from "../../types";
import { adminApi, currency } from "../../lib/api";
import { Button, EmptyState, Field, SelectField, StatusBadge, TextArea } from "../../components/ui";

const emptyRoom = {
  name: "",
  type: "Deluxe",
  description: "",
  pricePerNight: 18000,
  beds: 1,
  capacity: 2,
  sizeSqm: 35,
  status: "AVAILABLE" as RoomStatus,
  featured: false,
  hideFromWebsite: false,
  amenitiesText: "Free Wi-Fi, Breakfast Included",
  imagesText: ""
};

export function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyRoom);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  function load() {
    adminApi.rooms(search ? `?search=${encodeURIComponent(search)}` : "").then((payload) => setRooms(payload.rooms));
  }

  useEffect(load, []);

  const title = editing ? "Edit Room" : "Add Room";

  function startEdit(room: Room) {
    setEditing(room);
    setForm({
      name: room.name,
      type: room.type,
      description: room.description,
      pricePerNight: room.pricePerNight,
      beds: room.beds,
      capacity: room.capacity,
      sizeSqm: room.sizeSqm || 35,
      status: room.status,
      featured: room.featured,
      hideFromWebsite: room.hideFromWebsite,
      amenitiesText: room.amenities.map((amenity) => amenity.name).join(", "),
      imagesText: room.images.map((image) => image.url).join("\n")
    });
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const payload = await adminApi.uploadImage(file);
      setForm((current) => ({ ...current, imagesText: `${current.imagesText}\n${payload.url}`.trim() }));
      setMessage("Image uploaded.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await adminApi.saveRoom({
        id: editing?.id,
        name: form.name,
        type: form.type,
        description: form.description,
        pricePerNight: Number(form.pricePerNight),
        beds: Number(form.beds),
        capacity: Number(form.capacity),
        sizeSqm: Number(form.sizeSqm),
        status: form.status,
        featured: form.featured,
        hideFromWebsite: form.hideFromWebsite,
        amenities: form.amenitiesText.split(",").map((item) => item.trim()).filter(Boolean),
        images: form.imagesText
          .split("\n")
          .map((url) => url.trim())
          .filter(Boolean)
          .map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0, alt: form.name }))
      });
      setMessage("Room saved.");
      setEditing(null);
      setForm(emptyRoom);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Room save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRoom(id: string) {
    setLoading(true);
    try {
      const result = await adminApi.deleteRoom(id);
      setMessage(result?.message || "Room deleted.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete room.");
    } finally {
      setLoading(false);
    }
  }

  const sortedRooms = useMemo(() => rooms, [rooms]);

  return (
    <section className="admin-page two-column-admin">
      <div>
        <div className="admin-heading inline">
          <div>
            <span>Inventory</span>
            <h1>Room Management</h1>
          </div>
          <form
            className="admin-search"
            onSubmit={(event) => {
              event.preventDefault();
              load();
            }}
          >
            <input placeholder="Search rooms" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button variant="dark">Search</Button>
          </form>
        </div>
        {message ? <div className={message.includes("failed") || message.includes("Unable") ? "alert error" : "alert success"}>{message}</div> : null}
        <div className="admin-card-grid">
          {sortedRooms.length === 0 ? <EmptyState title="No rooms" body="Add a room to begin." /> : null}
          {sortedRooms.map((room) => (
            <article className="admin-room-card" key={room.id}>
              <img src={room.images[0]?.url} alt={room.name} />
              <div>
                <span>{room.type}</span>
                <h2>{room.name}</h2>
                <p>{currency(room.pricePerNight)} / night</p>
                <div className="room-admin-badges">
                  <StatusBadge value={room.status} />
                  {room.hideFromWebsite ? <span className="badge badge-hidden">Hidden from website</span> : null}
                </div>
              </div>
              <div className="admin-card-actions">
                <button className="icon-button" onClick={() => startEdit(room)} aria-label={`Edit ${room.name}`}>
                  <Pencil size={17} />
                </button>
                <button className="icon-button danger" onClick={() => deleteRoom(room.id)} aria-label={`Delete ${room.name}`}>
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <form className="admin-card admin-form" onSubmit={submit}>
        <h2>
          <Plus size={18} />
          {title}
        </h2>
        <Field label="Room name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Field label="Type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} />
        <div className="form-grid tight">
          <Field
            label="Price"
            type="number"
            value={form.pricePerNight}
            onChange={(event) => setForm({ ...form, pricePerNight: Number(event.target.value) })}
          />
          <Field label="Beds" type="number" value={form.beds} onChange={(event) => setForm({ ...form, beds: Number(event.target.value) })} />
          <Field
            label="Capacity"
            type="number"
            value={form.capacity}
            onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })}
          />
          <Field
            label="Size sqm"
            type="number"
            value={form.sizeSqm}
            onChange={(event) => setForm({ ...form, sizeSqm: Number(event.target.value) })}
          />
        </div>
        <SelectField label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as RoomStatus })}>
          {["AVAILABLE", "OCCUPIED", "MAINTENANCE", "UNAVAILABLE"].map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </SelectField>
        <label className="checkbox-line">
          <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
          Feature this room
        </label>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={form.hideFromWebsite}
            onChange={(event) => setForm({ ...form, hideFromWebsite: event.target.checked })}
          />
          Hide from Website
        </label>
        <TextArea label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <TextArea label="Amenities (comma separated)" value={form.amenitiesText} onChange={(event) => setForm({ ...form, amenitiesText: event.target.value })} />
        <TextArea label="Image URLs (one per line)" value={form.imagesText} onChange={(event) => setForm({ ...form, imagesText: event.target.value })} />
        <label className="upload-line">
          <ImagePlus size={18} />
          Upload room image
          <input type="file" accept="image/*" onChange={upload} />
        </label>
        <Button loading={loading}>{editing ? "Update Room" : "Create Room"}</Button>
        {editing ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEditing(null);
              setForm(emptyRoom);
            }}
          >
            Cancel Edit
          </Button>
        ) : null}
      </form>
    </section>
  );
}
