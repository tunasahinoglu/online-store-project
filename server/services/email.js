import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});


const sendEmail = async (to, subject, content, attachments=[]) => {
    const email = {
        from: process.env.EMAIL,
        to: to,
        subject: subject,
        html: content,
        attachments: attachments
    };
    await transporter.sendMail(email);
};

export default sendEmail;