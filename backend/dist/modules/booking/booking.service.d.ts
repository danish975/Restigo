import mongoose from 'mongoose';
export declare class BookingService {
    /**
     * STEP 1: Create a temporary hold on slot(s)
     *
     * Flow:
     * 1. Acquire Redis distributed lock (prevents concurrent access)
     * 2. Start MongoDB transaction
     * 3. Verify slot is AVAILABLE
     * 4. Update slot to HELD
     * 5. Create ReservationHold document
     * 6. Create Booking in pending_hold status
     * 7. Commit transaction
     * 8. Schedule expiration job
     * 9. Broadcast inventory update
     * 10. Release lock
     */
    createHold(userId: string, slotIds: string[], guests: {
        adults: number;
        children: number;
    }): Promise<{
        booking: any;
        holdExpiresAt: Date;
    }>;
    /**
     * STEP 2: Confirm booking after payment
     */
    confirmBooking(bookingId: string, userId: string, paymentData: {
        provider: 'stripe' | 'razorpay';
        externalPaymentId: string;
    }): Promise<any>;
    /**
     * Cancel a booking
     */
    cancelBooking(bookingId: string, userId: string, reason: string): Promise<any>;
    /**
     * Get user bookings with pagination
     */
    getUserBookings(userId: string, page?: number, limit?: number, status?: string): Promise<{
        bookings: (mongoose.Document<unknown, {}, import("./booking.model").IBooking, {}, {}> & import("./booking.model").IBooking & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get booking by ID
     */
    getBookingById(bookingId: string, userId: string): Promise<mongoose.Document<unknown, {}, import("./booking.model").IBooking, {}, {}> & import("./booking.model").IBooking & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
export declare const bookingService: BookingService;
//# sourceMappingURL=booking.service.d.ts.map