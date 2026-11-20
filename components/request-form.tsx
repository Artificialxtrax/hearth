"use client";

import { useActionState, useState } from "react";
import { DisclaimerNote } from "@/components/disclaimer-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRequest } from "@/lib/actions";
import { PERILS, type ActionState } from "@/lib/types";
import { perilLabel } from "@/lib/format";

const initial: ActionState = {};

async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1400;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not read that image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = 0.72;
  let url = canvas.toDataURL("image/jpeg", quality);
  while (url.length > 450_000 && quality > 0.4) {
    quality -= 0.1;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  if (url.length > 500_000) throw new Error("One photo is still too large. Choose a smaller image.");
  return url;
}

export function RequestForm() {
  const [state, action, pending] = useActionState(createRequest, initial);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    setPhotoError(null);
    if (!files || files.length === 0) {
      setPhotos([]);
      return;
    }
    if (files.length > 3) {
      setPhotoError("Attach up to 3 photos.");
      setPhotos([]);
      return;
    }
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) throw new Error("Use a JPEG or PNG.");
        next.push(await compress(file));
      }
      setPhotos(next);
    } catch (error) {
      setPhotos([]);
      setPhotoError(error instanceof Error ? error.message : "Could not read that photo.");
    }
  }

  return (
    <form action={action} className="space-y-5">
      {state.error ? (
        <p role="alert" className="border border-danger px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required list="hearth-cities" placeholder="Pacific Palisades" />
          <datalist id="hearth-cities">
            <option value="Pacific Palisades" />
            <option value="Malibu" />
            <option value="Topanga" />
            <option value="Altadena" />
            <option value="La Cañada Flintridge" />
            <option value="La Crescenta" />
            <option value="Calabasas" />
            <option value="Brentwood" />
            <option value="Montecito" />
            <option value="Santa Rosa" />
            <option value="Lake Arrowhead" />
          </datalist>
          {state.fieldErrors?.city ? <p className="text-sm text-danger">{state.fieldErrors.city}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" required defaultValue="CA" maxLength={2} />
          {state.fieldErrors?.state ? <p className="text-sm text-danger">{state.fieldErrors.state}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="zip">ZIP</Label>
          <Input id="zip" name="zip" required inputMode="numeric" placeholder="90272" maxLength={5} />
          {state.fieldErrors?.zip ? <p className="text-sm text-danger">{state.fieldErrors.zip}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="peril">Peril</Label>
          <select
            id="peril"
            name="peril"
            defaultValue="wildfire"
            className="h-11 w-full border border-line bg-card px-3 text-base"
          >
            {PERILS.map((peril) => (
              <option key={peril} value={peril}>
                {perilLabel(peril)}
              </option>
            ))}
          </select>
          {state.fieldErrors?.peril ? <p className="text-sm text-danger">{state.fieldErrors.peril}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="coverageAmount">Coverage amount (USD)</Label>
          <Input id="coverageAmount" name="coverageAmount" required inputMode="decimal" placeholder="1500000" />
          {state.fieldErrors?.coverageAmount ? (
            <p className="text-sm text-danger">{state.fieldErrors.coverageAmount}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deductible">Deductible (USD)</Label>
          <Input id="deductible" name="deductible" required inputMode="decimal" placeholder="25000" />
          {state.fieldErrors?.deductible ? <p className="text-sm text-danger">{state.fieldErrors.deductible}</p> : null}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="startDate">Coverage would start</Label>
        <Input id="startDate" name="startDate" type="date" required />
        {state.fieldErrors?.startDate ? <p className="text-sm text-danger">{state.fieldErrors.startDate}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Roof, brush clearance, why the admitted market walked away." />
        {state.fieldErrors?.notes ? <p className="text-sm text-danger">{state.fieldErrors.notes}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="photos">Photos, optional</Label>
        <Input
          id="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => {
            void onFiles(event.target.files);
          }}
        />
        <p className="text-xs leading-5 text-muted">Up to three. They are stored with the request so other desks can see them.</p>
        {photoError ? <p className="text-sm text-danger">{photoError}</p> : null}
        {photos.map((photo, index) => (
          <input key={`photo-${index}`} type="hidden" name="photo" value={photo} />
        ))}
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <span key={`preview-${index}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="Compressed preview of a photo you attached" className="aspect-[4/3] w-full object-cover" />
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <DisclaimerNote />
      <Button type="submit" variant="ember" disabled={pending || Boolean(photoError)}>
        {pending ? "Posting…" : "Post coverage request"}
      </Button>
    </form>
  );
}
