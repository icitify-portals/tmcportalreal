
import React from "react";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContactLocationProps {
    org: any;
}

export const ContactLocation = ({ org }: ContactLocationProps) => (
    <Card className="h-fit">
        <CardHeader className="bg-primary/5 pb-4">
            <CardTitle>Location & Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
            {org.address && (
                <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-sm">Address</h4>
                        <p className="text-sm text-muted-foreground">{org.address}</p>
                        <p className="text-sm text-muted-foreground">{org.city} {org.state}</p>
                    </div>
                </div>
            )}

            {(org.phone || org.whatsapp) && (
                <div className="flex gap-3">
                    <Phone className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-sm">Phone</h4>
                        {org.phone && <p className="text-sm text-muted-foreground"><a href={`tel:${org.phone}`} className="hover:underline">{org.phone}</a></p>}
                        {org.whatsapp && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                <a href={`https://wa.me/${org.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" className="hover:underline text-green-600 font-medium">WhatsApp Chat</a>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {org.email && (
                <div className="flex gap-3">
                    <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-sm">Email</h4>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={org.email}>
                            <a href={`mailto:${org.email}`} className="hover:underline">{org.email}</a>
                        </p>
                    </div>
                </div>
            )}

            {org.officeHours && (
                <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-sm">Office Hours</h4>
                        <p className="text-sm text-muted-foreground">{org.officeHours}</p>
                    </div>
                </div>
            )}

            {org.googleMapUrl && (
                <div className="pt-2 rounded-md overflow-hidden border">
                    <iframe
                        src={org.googleMapUrl}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            )}
        </CardContent>
    </Card>
);
