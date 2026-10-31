import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useSocketEvent } from './useSocket.js';

/** Active service announcements, kept live via the announcements:update event. */
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api.announcements().then(setAnnouncements).catch(() => {});
  }, []);
  useSocketEvent('announcements:update', setAnnouncements);

  return announcements;
}
