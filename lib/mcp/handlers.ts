import { createClient } from "@supabase/supabase-js";
import type {
  BookMeetingInput,
  CheckAvailabilityInput,
  CreateLeadInput,
  GetPropertyDetailsInput,
  SearchPropertiesInput,
} from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Search for properties based on criteria
 */
export async function handleSearchProperties(
  userId: string,
  input: SearchPropertiesInput,
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let query = supabase.from("properties").select("*").eq("user_id", userId);

  // Apply filters
  if (input.city) {
    query = query.ilike("city", `%${input.city}%`);
  }
  if (input.property_type) {
    query = query.eq("property_type", input.property_type);
  }
  if (input.min_price) {
    query = query.gte("price", input.min_price);
  }
  if (input.max_price) {
    query = query.lte("price", input.max_price);
  }
  if (input.min_bedrooms) {
    query = query.gte("bedrooms", input.min_bedrooms);
  }
  if (input.min_bathrooms) {
    query = query.gte("bathrooms", input.min_bathrooms);
  }
  if (input.status) {
    query = query.eq("status", input.status);
  } else {
    query = query.eq("status", "active"); // Default to active
  }

  query = query.limit(input.limit || 10);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search properties: ${error.message}`);
  }

  // Format for conversation
  return {
    count: data?.length || 0,
    properties: data?.map((p) => ({
      id: p.id,
      address: p.address,
      city: p.city,
      price: p.price,
      property_type: p.property_type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      square_feet: p.square_feet,
      description: p.description,
      features: p.features,
      status: p.status,
    })),
  };
}

/**
 * Get detailed information about a specific property
 */
export async function handleGetPropertyDetails(
  userId: string,
  input: GetPropertyDetailsInput,
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", input.property_id)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(`Property not found: ${error.message}`);
  }

  return {
    property: data,
  };
}

/**
 * Create a new lead from conversation
 */
export async function handleCreateLead(userId: string, input: CreateLeadInput) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const notes =
    input.job_description && input.notes
      ? `${input.notes}\n\nJob description: ${input.job_description}`
      : input.job_description
        ? input.job_description
        : input.notes || null;

  const leadData = {
    user_id: userId,
    name: input.name,
    phone: input.phone || null,
    email: input.email || null,
    is_lead: true,
    lead_quality: input.lead_quality,
    lead_source: "vapi-call",
    notes,
    budget_min: input.budget_min ?? null,
    budget_max: input.budget_max ?? null,
    // Map service/job fields onto existing contact columns for now
    property_type: input.service_type || null,
    bedrooms_min: null,
    location_preference: input.job_address || null,
    timeline: input.urgency || null,
  };

  const { data, error } = await supabase
    .from("contacts")
    .insert(leadData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  return {
    success: true,
    lead_id: data.id,
    message: `Lead created successfully for ${input.name}`,
    lead: data,
  };
}

/**
 * Check calendar availability for a date
 */
export async function handleCheckAvailability(
  userId: string,
  input: CheckAvailabilityInput,
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const date = new Date(input.date);
  const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

  // Get all events for the day
  const { data: events, error } = await supabase
    .from("events")
    .select("start_time, end_time")
    .eq("user_id", userId)
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay)
    .order("start_time");

  if (error) {
    throw new Error(`Failed to check availability: ${error.message}`);
  }

  // Business hours: 9 AM - 5 PM
  const businessStart = 9;
  const businessEnd = 17;
  const slotDuration = input.duration_minutes || 60;

  const availableSlots: { start: string; end: string }[] = [];
  const bookedSlots = events || [];

  // Generate time slots
  for (let hour = businessStart; hour < businessEnd; hour++) {
    const slotStart = new Date(input.date);
    slotStart.setHours(hour, 0, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

    // Check if slot conflicts with any booked event
    const hasConflict = bookedSlots.some((event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      return slotStart < eventEnd && slotEnd > eventStart;
    });

    if (!hasConflict && slotEnd.getHours() <= businessEnd) {
      availableSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }
  }

  return {
    date: input.date,
    available_slots: availableSlots,
    count: availableSlots.length,
  };
}

/**
 * Book a meeting or showing
 */
export async function handleBookMeeting(
  userId: string,
  input: BookMeetingInput,
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // First, find or create the contact
  let contactId: string | null = null;

  if (input.contact_phone || input.contact_email) {
    // Try to find existing contact
    let contactQuery = supabase
      .from("contacts")
      .select("id")
      .eq("user_id", userId);

    if (input.contact_phone) {
      contactQuery = contactQuery.eq("phone", input.contact_phone);
    } else if (input.contact_email) {
      contactQuery = contactQuery.eq("email", input.contact_email);
    }

    const { data: existingContact } = await contactQuery.single();

    if (existingContact) {
      contactId = existingContact.id;
    }
  }

  // Create contact if not found
  if (!contactId) {
    const { data: newContact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        user_id: userId,
        name: input.contact_name,
        phone: input.contact_phone || null,
        email: input.contact_email || null,
        is_lead: true,
        lead_quality: 2, // Medium quality by default for bookings
        lead_source: "vapi-booking",
      })
      .select()
      .single();

    if (contactError) {
      throw new Error(`Failed to create contact: ${contactError.message}`);
    }

    contactId = newContact.id;
  }

  // Create the event
  const eventData = {
    user_id: userId,
    title: input.title,
    description: input.description || null,
    start_time: input.start_time,
    end_time: input.end_time,
    status: "busy",
    event_type: input.event_type || "site_visit",
    contact_id: contactId,
    // Store job_id in the existing property_id column for now
    property_id: input.job_id || null,
  };

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert(eventData)
    .select()
    .single();

  if (eventError) {
    throw new Error(`Failed to create event: ${eventError.message}`);
  }

  return {
    success: true,
    event_id: event.id,
    contact_id: contactId,
    message: `Meeting booked successfully for ${input.contact_name}`,
    event: {
      id: event.id,
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      event_type: event.event_type,
    },
  };
}
