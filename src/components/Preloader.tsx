import { TrayIcon } from './Icons';

export default function Preloader() {
  return (
    <div className="preloader">
      <div className="lattice-strip" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
      <div className="preloader-spinner">
        <div className="preloader-ring" />
        <TrayIcon className="tray preloader-tray" />
      </div>
      <div className="preloader-brand">Volidam</div>
      <div className="preloader-sub">Algoritm</div>
      <div className="lattice-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
    </div>
  );
}

