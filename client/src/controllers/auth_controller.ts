import { Request, Response } from 'express';
import Donor, { IDonor }  from '../models/donor_model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Document } from 'mongoose';

// THE DONOR MODEL IS NOT DEFINED YET

const client = new OAuth2Client();
const googleSignin = async (req: Request, res: Response) => {
    console.log( "cradentiasle:" + req.body.credential);
    try {
        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        const email = payload?.email;
        if (email != null) {
            let donor = await Donor.findOne({ 'email': email });
            if (donor == null) {
                donor = await donor.create(
                    {
                        'firstName': payload?.firstName,
                        'lastName': payload?.lastName,
                        '_id': payload?.sub,
                        'email': email,
                        'phoneNumber': payload?.phoneNumber,
                        'address': payload?.address,
                        'password': '0',
                        'image': payload?.picture
                    });
            }
            const tokens = await generateTokens(donor)
            res.status(200).send(
                {
                    email: donor.email,
                    _id: donor._id,
                    image: donor.image,
                    ...tokens,
                })
        }
    } catch (err) {
        return res.status(400).send(err.message);
    }

}

const generateTokens = async (donor: Document & IDonor) => {
    const accessToken = jwt.sign({ _id: donor._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
    const refreshToken = jwt.sign({ _id: donor._id }, process.env.JWT_REFRESH_SECRET);
    if (donor.refreshTokens == null) {
        donor.refreshTokens = [refreshToken];
    } else {
        donor.refreshTokens.push(refreshToken);
    }
    await donor.save();
    return {
        'accessToken': accessToken,
        'refreshToken': refreshToken
    };
}

const register = async (req: Request, res: Response) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const id = req.body._id;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;
    const address = req.body.address; 
    const password = req.body.password;
    const image = req.body.image;
    if (!email || !password) {
        return res.status(400).send("missing email or password");
    }
    try { 
        const rs = await Donor.findOne({ 'email': email });
        if (rs != null) {
            return res.status(406).send("email already exists");
        }
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);
        const rs2 = await Donor.create({
        'firstName': firstName,
        'lastName':lastName,
        '_id':id,
        'image': image,
        'email': email, 
        'phoneNumber' :phoneNumber,
        'address': address,
        'password': encryptedPassword });

        const tokens = await generateTokens(rs2)
        return res.status(201).send({
        'firstName': firstName,
        'lastName':lastName,
        '_id':id,
        'email': email, 
        'phoneNumber' :phoneNumber,
        'address': address,
        'password': encryptedPassword,
        'image': image,
        ...tokens
        });
    } catch (err) {
        return res.status(400).send(err);
    }
}

const login = async (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
        return res.status(400).send("missing email or password");
    }
    try {
        const donor = await Donor.findOne({ 'email': email });
        if (donor == null) {
            return res.status(401).send("email or password incorrect");
        }
        const match = await bcrypt.compare(password, donor.password);
        if (!match) {
            return res.status(401).send("email or password incorrect");
        }
        const tokens = await generateTokens(donor)
        return res.status(200).send({
        'firstName': donor.firstName,
        'lastName':donor.lastName,
        '_id':donor.id,
        'email': donor.email, 
        'phoneNumber' :donor.phoneNumber,
        'address': donor.address,
        'password': donor.encryptedPassword,
        'image': donor.image,
        ...tokens
        });
    } catch (err) {
        return res.status(400).send("error missing email or password");
    }
}

const logout = async (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const refreshToken = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (refreshToken == null) return res.sendStatus(401);
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, donor: { '_id': string }) => {
        if (err) return res.sendStatus(401);
        try {
            const donorDb = await Donor.findOne({ '_id': donor._id });
            if (!donorDb.refreshTokens || !donorDb.refreshTokens.includes(refreshToken)) {
                donorDb.refreshTokens = [];
                await donorDb.save();
                return res.sendStatus(401);
            } else {
                donorDb.refreshTokens = donorDb.refreshTokens.filter(t => t !== refreshToken);
                await donorDb.save();
                console.log("logout success");
                return res.sendStatus(200);
            }
        } catch (err) {
            res.sendStatus(401).send(err.message);
        }
    });
}

const refresh = async (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    console.log("authHeader is: "+ authHeader);
    const refreshToken = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    console.log(" refreshToken is: "+ refreshToken);
    console.log(process.env.JWT_REFRESH_SECRET);
    if (refreshToken == null) return res.sendStatus(401);
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, donor: { '_id': string }) => {
        if (err) {
            return res.sendStatus(401);
        }
        try {
            const donorDb = await Donor.findOne({ '_id': donor._id });
            if (!donorDb) {
                console.log('Donor not found');
                return res.sendStatus(401);
              }
            if (!donorDb.refreshTokens || !donorDb.refreshTokens.includes(refreshToken)) {
                donorDb.refreshTokens = [];
                await donorDb.save();
                return res.sendStatus(401);
            }
            const accessToken = jwt.sign({ _id: donor._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
            const newRefreshToken = jwt.sign({ _id: donor._id }, process.env.JWT_REFRESH_SECRET);
            donorDb.refreshTokens = donorDb.refreshTokens.filter(t => t !== refreshToken);
            donorDb.refreshTokens.push(newRefreshToken);
            await donorDb.save();
            return res.status(200).send({
                'accessToken': accessToken,
                'refreshToken': newRefreshToken
            });
        } catch (err) {
            res.sendStatus(401).send(err.message);
        }
    });
}

export default {
    googleSignin,
    register,
    login,
    logout,
    refresh,
    generateTokens
}