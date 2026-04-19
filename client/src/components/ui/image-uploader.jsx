"use client";

import { useCallback, useMemo, useState } from "react";

export default function ImageUploader({ multiple = true, maxSizeMB = 5, onChange }) {
  const [previews, setPreviews] = useState([]);

  const handleFiles = useCallback(
    (files) => {
      const arr = Array.from(files || []);
      const valid = arr.filter((file) => file.type.startsWith("image/") && file.size <= maxSizeMB * 1024 * 1024);

      const nextPreviews = valid.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
      setPreviews(nextPreviews);

      if (onChange) onChange(valid);
    },
    [maxSizeMB, onChange]
  );

  const onInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const clear = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
    if (onChange) onChange([]);
  };

  const previewNodes = useMemo(
    () =>
      previews.map((p) => (
        <div key={p.url} className="w-24 h-24 rounded overflow-hidden border bg-white/5">
          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
        </div>
      )),
    [previews]
  );

  return (
    <div className="image-uploader">
      <label className="inline-block">
        <div className="btn">Choose images</div>
        <input type="file" accept="image/*" multiple={multiple} onChange={onInputChange} className="hidden" />
      </label>

      <div className="mt-2 flex gap-2">{previewNodes}</div>

      {previews.length > 0 && (
        <div className="mt-2">
          <button type="button" className="btn ghost" onClick={clear}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
