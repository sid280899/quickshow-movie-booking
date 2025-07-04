import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-from-clerk'},
    {event: 'clerk/user.created'},
    async ({ event })=>{
        const {id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            image: image_url
        }
        await User.create(userData)
    }
)

// Inngest Function to delete user from database
const syncUserDeletion = inngest.createFunction(
    {id: 'delete-user-with-clerk'},
    {event: 'clerk/user.deleted'},
    async ({ event })=>{
        const {id} = event.data
        await User.findByIdAndDelete(id)
    }
)

// Inngest Function to update user data in  database
const syncUserUpdation = inngest.createFunction(
    {id: 'update-user-from-clerk'},
    {event: 'clerk/user.updated'},
    async ({ event })=>{
        const {id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            image: image_url
        }
        await User.findByIdAndUpdate(id, userData)
    }
)

// Inngest Function to cancel booking and release the seats of show after 10 minutes of booking created if payment is not made
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    {id: 'release-seats-delete-booking'},
    {event: "app/checkpayment"},
    async ({event, step})=>{
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

        await step.run('check-payment-status', async ()=>{
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId);

            // If payment is not made, release the seats and delete the booking
            if(!booking.isPaid){
                const show = await Show.findById(booking.show);
                booking.bookedSeats.forEach((seat)=>{
                    delete show.occupiedSeats[seat]
                });
                show.markModified('occupiedSeats');
                await show.save();
                await Booking.findByIdAndDelete(booking._id);
            }
        })
    }
)

// Inngest Function to send email to user after booking is created
const sendBookingConfirmationEmail = inngest.createFunction(
    {id: 'send-booking-confirmation-email'},
    {event: 'app/show.booked'},
    async ({event, step})=>{
        const { bookingId } = event.data;

        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: {
                path: 'movie',
                model: 'Movie'
            }
        }).populate('user');

        await sendEmail({
            to: booking.user.email,
            subject: `🎉 Booking Confirmed: "${booking.show.movie.title}" - See You Soon!`,
            body: ` <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #fefefe; border-radius: 10px; color: #333;">
                        <h2 style="color: #28a745;">Hi ${booking.user.name},</h2>
                        <p style="font-size: 16px;">
                            Your booking for <strong style="color: #F84565;">"${booking.show.movie.title}"</strong> has been successfully confirmed! 🎟️
                        </p>
                        <div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-left: 5px solid #28a745; border-radius: 6px;">
                            <p><strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
                            <p><strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
                        </div>
                        <p style="font-size: 15px;">We’re thrilled to have you! Get ready for an amazing movie experience. 🍿</p>
                        <br/>
                        <p style="font-size: 14px; color: #555;">Thanks for booking with us!<br/><strong>- QuickShow Team</strong></p>
                    </div>`
        })
    }
)

// Inngest Function to send reminder
const sendShowReminders = inngest.createFunction(
    {id: 'send-show-reminders'},
    {cron: '0 */8 * * *'},  // Every 8 hours
    async ({ step })=>{
        const now = new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

        // Prepare reminder tasks
        const reminderTasks = await step.run('prepare-reminder-tasks', async ()=>{
            const shows = await Show.find({
                showTime: { $gte: windowStart, $lte: in8Hours },
            }).populate('movie');

            const tasks = [];

            for(const show of shows){
                if(!show.movie || !show.occupiedSeats) continue;

                const userIds = [...new Set(Object.values(show.occupiedSeats))];
                if(userIds.length === 0) continue;

                const users = await User.find({_id: {$in : userIds}}).select("name email");

                for(const user of users){
                    tasks.push({
                        userEmail: user.email,
                        userName: user.name,
                        movieTitle: show.movie.title,
                        showTime: show.showTime,
                    })
                }
            }
            return tasks;
        })

        if(reminderTasks.length === 0){
            return {sent: 0, message: "No reminders to send."}
        }

        // Send reminder emails
        const results = await step.run('send-all-reminders', async ()=>{
            return await Promise.allSettled(
                reminderTasks.map(task => sendEmail({
                    to: task.userEmail,
                    subject: `🎬 Reminder: Your movie "${task.movieTitle}" starts soon!`,
                    body: ` <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #fffbe6; border-radius: 10px; color: #333;">
                                <h2 style="color: #F84565;">Hey ${task.userName},</h2>
                                <p style="font-size: 16px;">Just a reminder that your movie:</p>
                                <div style="padding: 16px; background-color: #ffffff; border-left: 5px solid #F84565; margin: 20px 0; border-radius: 6px;">
                                    <h3 style="margin: 0; color: #000;">🎥 <span style="color: #F84565;">"${task.movieTitle}"</span></h3>
                                    <p style="margin: 8px 0 0; font-size: 15px;">
                                        <strong>Date:</strong> ${new Date(task.showTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}<br/>
                                        <strong>Time:</strong> ${new Date(task.showTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
                                    </p>
                                </div>
                                <p style="font-size: 15px;">Only <strong>8 hours to go</strong> – make sure your popcorn is ready! 🍿</p>
                                <br/>
                                <p style="font-size: 14px; color: #555;">See you at the movies!<br/><strong>- QuickShow Team</strong></p>
                            </div>`
                }))
            )
        })

        const sent = results.filter(r => r.status === "fulfilled").length;
        const failed = results.length - sent

        return {
            sent,
            failed,
            message: `Sent ${sent} reminder(s), ${failed} failed.`
        }
    }
)

// Inngest Function to send notifications when a new show is added
const sendNewShowNotifications = inngest.createFunction(
    {id: 'send-new-show-notifications'},
    {event: 'app/show.added'},
    async ({ event })=>{
        const { movieTitle } = event.data;

        const users = await User.find({})

        for(const user of users){
            const userEmail = user.email;
            const userName = user.name;

            const subject = `🎬 New Show Added: ${movieTitle}`;
            const body =  `
            <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f9f9f9; border-radius: 10px; color: #333;">
              <h2 style="color: #F84565;">🍿 Hello ${userName},</h2>
              <p style="font-size: 16px;">
                We're excited to announce a brand-new movie show just added to our platform!
              </p>
              <div style="padding: 16px; background-color: #fff; border-left: 5px solid #F84565; margin: 20px 0; border-radius: 6px;">
                <h3 style="margin: 0; color: #000;">🎬 <span style="color: #F84565;">${movieTitle}</span></h3>
                <p style="margin: 8px 0 0; font-size: 15px;">Now available for booking on <strong>QuickShow</strong>.</p>
              </div>
              <a href="https://quickshow-rust.vercel.app/" target="_blank" style="display: inline-block; margin-top: 20px; background-color: #F84565; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 5px; font-weight: bold;">
                🎟️ Book Your Seats Now
              </a>
              <p style="margin-top: 30px; font-size: 14px; color: #555;">Thank you for being part of QuickShow!<br/>— The QuickShow Team</p>
            </div>
          `

                            await sendEmail({
                                to: userEmail,
                                subject,
                                body,
                            })
        }

        return {message: "Notifications sent."}
    } 
)

export const functions = [
    syncUserCreation, 
    syncUserDeletion, 
    syncUserUpdation, 
    releaseSeatsAndDeleteBooking, 
    sendBookingConfirmationEmail, 
    sendShowReminders,
    sendNewShowNotifications
];