import { Router } from 'express';
import type { EnquiriesService } from './enquiries.service.js';
import { enquirySchema } from './enquiry.schema.js';

export function enquiriesRoutes(enquiries: EnquiriesService): Router {
  const router = Router();

  router.post('/enquiries', async (req, res) => {
    const enquiry = enquirySchema.parse(req.body);
    res.status(201).json(await enquiries.submit(enquiry));
  });

  return router;
}
