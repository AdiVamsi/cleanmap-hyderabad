-- Performance indexes
create index if not exists spots_status_idx on spots(status);
create index if not exists spots_lat_lon_idx on spots(latitude, longitude);
create index if not exists spots_created_at_idx on spots(created_at desc);
create index if not exists photos_spot_id_idx on photos(spot_id);
create index if not exists status_history_spot_id_idx on status_history(spot_id);
create index if not exists stories_spot_id_idx on stories(spot_id);
create index if not exists stories_published_idx on stories(published) where published = true;
