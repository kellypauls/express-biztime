const express = require('express');
const router = new express.Router();
const db = require('../db')
const expressError = require('../expressError')




async function updateAmt(amt, id){
    let result = await db.query(`UPDATE invoices
            SET amt=$1 WHERE id=$2 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [amt, id]);
            return result.rows[0];
}

async function updatePaid(amt, paid, id){
    let result;
    if (paid === true){
        result = await db.query(`UPDATE invoices SET amt=$1, 
            paid=$2, paid_date=CURRENT_TIMESTAMP WHERE id=$3 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [amt, paid, id]);
            return result.rows[0];
    }
    if (paid === false){
        result = await db.query(`UPDATE invoices SET amt=$1, 
            paid=$2, paid_date=NULL WHERE id=$3 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [amt, paid, id]);
            return result.rows[0];
    }   
}




router.get('/', async function(req, res, next){
    try{
        let invoices = await db.query(`SELECT * FROM invoices`);
        invoices = JSON.stringify(invoices.rows)
        return res.send(`{invoices: ${invoices}}`);
    } catch(e){
        return next(e);
    }
})

router.get('/:id', async function(req, res, next){
    try{
        let invoice = await db.query(`SELECT * FROM invoices WHERE id=$1`, [req.params.id]);
        invoice = JSON.stringify(invoice.rows[0])
        if (typeof invoice === 'undefined'){
            throw new expressError('Invoice not found', 404);
        }
        return res.send(`{invoice: ${invoice}}`);
    } catch(e){
        return next(e);
    }
})

router.post('/', async function(req, res, next){
    try{
        const { comp_code, amt } = req.body;
        if (!comp_code || !amt){
            throw new expressError('All parameters must be defined', 400);
        }
        let result = await db.query(`INSERT INTO invoices 
            (comp_code, amt) VALUES 
            ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]);
        result = JSON.stringify(result.rows[0]);
        return res.status(201).send(`{invoice: ${result}}`);
    } catch(e){
        return next(e);
    }
})

router.put('/:id', async function(req, res, next){
    try{
        let result;
        const id = req.params.id;
        const {amt, paid} = req.body;
        if (!amt || (!paid && paid !== false)){
            throw new expressError('All parameters must be defined', 400);
        }
        let invoice = await db.query(`SELECT paid FROM invoices 
            WHERE id=$1`, [id])
        if (invoice.rows.length === 0){
            throw new expressError('Invoice not found', 404);
        }
        if (invoice.rows[0].paid === paid){
            result = await updateAmt(amt, id);
        } else if (paid === true || paid === false) {
            result = await updatePaid(amt, paid, id);
        } else {
            throw new expressError("'paid' must be either true or false", 400)
        }
        result = JSON.stringify(result);
        return res.send(`{invoice: ${result}}`);
    } catch(e){
        return next(e);
    }
})

router.delete('/:id', async function(req, res, next){
    try{
        let invoice = await db.query(`SELECT * FROM invoices WHERE id=$1`, [req.params.id]);
        if (invoice.rows.length === 0){
            throw new expressError('Invoice not found', 404);
        }
        const result = await db.query(`DELETE FROM invoices
            WHERE id = $1`, [req.params.id]);
            return res.json({"status": "deleted"})
    } catch(e){
        return next(e);
    }
})

router.get('/companies/:code', async function(req, res, next){
    try{
        let results = await db.query(`SELECT * FROM invoices
            JOIN companies ON 
            companies.code = invoices.comp_code
            WHERE code=$1 `, [req.params.code])
        if (results.rows.length === 0){
            throw new expressError('Company not found or has no invoices', 404);
        }
        let invoices = [];
        for (row of results.rows){
            invoices.push(`{"id": ${row.id}, "amt": ${row.amt}, 
            "paid": ${row.paid}, "add_date": ${row.add_date}, 
            "paid_date": ${row.paid_date}}`)
        }
        return res.send(`{company: {"code": ${results.rows[0].code}, 
            "name": ${results.rows[0].name}, "description": ${results.rows[0].description}, 
            "invoices": ${invoices}}`)
    } catch(e){
        return next(e);
    }
})


module.exports = router