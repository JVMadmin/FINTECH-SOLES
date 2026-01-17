import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Phone, User } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to recenter map when coordinates change
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 16);
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapModal({ 
  isOpen, 
  onClose, 
  coordinates, 
  clientName, 
  clientAddress, 
  clientPhone 
}) {
  const hasValidCoordinates = coordinates?.lat && coordinates?.lng;
  
  const openGoogleMaps = () => {
    if (hasValidCoordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
      window.open(url, "_blank");
    } else if (clientAddress) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clientAddress)}`;
      window.open(url, "_blank");
    }
  };

  const openWaze = () => {
    if (hasValidCoordinates) {
      const url = `https://waze.com/ul?ll=${coordinates.lat},${coordinates.lng}&navigate=yes`;
      window.open(url, "_blank");
    }
  };

  const callClient = () => {
    if (clientPhone) {
      window.location.href = `tel:${clientPhone}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Ubicación del Cliente
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {clientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-4 pb-2">
          {clientAddress && (
            <p className="text-sm text-gray-600 mb-2">
              <MapPin className="w-3 h-3 inline mr-1" />
              {clientAddress}
            </p>
          )}
        </div>

        {/* Map Container */}
        <div className="h-[350px] w-full relative" data-testid="map-container">
          {hasValidCoordinates ? (
            <MapContainer
              center={[coordinates.lat, coordinates.lng]}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[coordinates.lat, coordinates.lng]} icon={customIcon}>
                <Popup>
                  <div className="text-center">
                    <strong>{clientName}</strong>
                    {clientAddress && <p className="text-xs mt-1">{clientAddress}</p>}
                  </div>
                </Popup>
              </Marker>
              <MapRecenter lat={coordinates.lat} lng={coordinates.lng} />
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No hay coordenadas GPS disponibles</p>
                <p className="text-sm">Use el botón de Google Maps para buscar la dirección</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-gray-50 flex flex-wrap gap-2 justify-center">
          <Button
            onClick={openGoogleMaps}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="open-google-maps"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Google Maps
          </Button>
          
          {hasValidCoordinates && (
            <Button
              onClick={openWaze}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="open-waze"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Waze
            </Button>
          )}
          
          {clientPhone && (
            <Button
              onClick={callClient}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
              data-testid="call-client"
            >
              <Phone className="w-4 h-4 mr-2" />
              Llamar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
