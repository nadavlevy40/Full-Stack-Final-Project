import { Request, Response } from "express";
import { Model } from "mongoose";
import DonorModel, { IDonor } from "../models/donor_model";

export class DonorController {
    constructor(private model: Model<IDonor>) {}

    async get(req: Request, res: Response) {
        console.log("getAll Donors");
        try {
            const donors = await this.model.find();
            res.send(donors);
        } catch (err) {
            res.status(406).json({ message: err.message });
        }
    }

    async getById(req: Request, res: Response) {
        console.log("getDonorById:" + req.params.id);
        try {
            const donor = await this.model.findById(req.params.id);
            res.send(donor);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async post(req: Request, res: Response) {
        console.log("postDonor:" + req.body);
        try {
            const obj = await this.model.create(req.body);
            res.status(201).send(obj);
        } catch (err) {
            console.log(err);
            res.status(406).send("fail: " + err.message);
        }
    }

    async putById(req: Request, res: Response) {
        console.log("putDonorById:" + req.body);
        try {
            await this.model.findByIdAndUpdate(req.params.id, req.body);
            const obj = await this.model.findById(req.params.id);
            res.status(200).send(obj);
        } catch (err) {
            console.log(err);
            res.status(406).send("fail: " + err.message);
        }
    }

    async deleteById(req: Request, res: Response) {
        console.log("deleteDonorById:" + req.params.id);
        try {
            await this.model.findByIdAndDelete(req.params.id);
            res.status(200).send("OK");
        } catch (err) {
            console.log(err);
            res.status(406).send("fail: " + err.message);
        }
    }
}

const DonorControllerInstance = new DonorController(DonorModel);

export default DonorControllerInstance;
