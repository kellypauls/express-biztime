const express = require('express');
const router = new express.Router();
const db = require('../db')
const expressError = require('../expressError')


router.get('/', async function(req, res, next){
    try{
        let industries = await db.query(`SELECT * FROM industries JOIN 
            company_industries ON industries.code=company_industries.ind_code 
            JOIN companies ON company_industries.comp_code=companies.code 
            ORDER BY industries.industry;`);
        industries = JSON.stringify(industries.rows)
        return res.json(`{industries: ${industries}}`);
    } catch(e){
        return next(e);
    }
})

router.post('/', async function(req, res, next){
    try{
        const { code, industry } = req.body;
        if (!code || !industry){
            throw new expressError('All parameters must be defined', 400);
        }
        let ind = await db.query(`INSERT INTO industries (code, industry) 
            VALUES ($1, $2) RETURNING code, industry`, [code, industry]);
        ind = JSON.stringify(ind.rows[0]);
        return res.status(201).json(`{industry: ${ind}}`);
    } catch(e){
        return next(e);
    }
})

router.post('/:code', async function(req, res, next){
    try{
        let ind = req.body.ind_code
        let result = await db.query(`INSERT INTO company_industries (comp_code, ind_code) 
        VALUES ($1, $2) RETURNING comp_code, ind_code`, [req.params.code, ind])
        result = JSON.stringify(result.rows[0]);
        return res.status(201).json(`{company_industry: ${result}}`);
    } catch(e){
        return next(e);
    }
})


module.exports = router