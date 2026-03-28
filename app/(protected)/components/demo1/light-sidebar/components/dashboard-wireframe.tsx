'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';

import {
  Dialog,
  DialogContent,
} from '../../../../../../components/ui/dialog';

import MapLibrePreview from '../../../../../components/maps/MapPreviewContent';

const gazaPlaces = [
  { id: 'shelter_01', name: 'مأوى الأزهر', type: 'Shelter', lng: 34.4667, lat: 31.5017 },
  { id: 'aid_01', name: 'مركز توزيع', type: 'Aid Center', lng: 34.45, lat: 31.52 },
  { id: 'clinic_01', name: 'عيادة', type: 'Clinic', lng: 34.48, lat: 31.51 },
];

const MapPreview = () => {
  const [fullOpen, setFullOpen] = useState(false);

  const filteredPlaces = gazaPlaces;

  return (
    <>
      <Card className="h-full">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle dir="ltr" className="text-base text-left">
              Map Preview
            </CardTitle>

            <Button
              dir="ltr"
              variant="outline"
              size="sm"
              onClick={() => setFullOpen(true)}
            >
              Open Full Map
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div dir="ltr" className="rounded-lg overflow-hidden">
            <MapLibrePreview
              lng={34.4667}
              lat={31.5}
              zoom={10}
              height={420}
              places={filteredPlaces}
              osmEnabled={true}
              osmAmenities={[
                'hospital',
                'clinic',
                'school',
                'pharmacy',
                'doctors',
                'drinking_water',
              ]}
              osmCategories={{
                shelters: true,
                medical: true,
                aid: true,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={fullOpen} onOpenChange={setFullOpen}>
        <DialogContent className="max-w-[1100px] p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div dir="ltr" className="font-semibold">Full Map</div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFullOpen(false)}
            >
              Close
            </Button>
          </div>

          <div className="p-4">
            <MapLibrePreview
              lng={34.4667}
              lat={31.5}
              zoom={11}
              height={650}
              places={filteredPlaces}
              osmEnabled={true}
              osmAmenities={[
                'hospital',
                'clinic',
                'school',
                'pharmacy',
                'doctors',
                'drinking_water',
              ]}
              osmCategories={{
                shelters: true,
                medical: true,
                aid: true,
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const DashboardWireframe = () => {
  return (
    <div className="grid gap-6">
      <MapPreview />
    </div>
  );
};

export { DashboardWireframe };