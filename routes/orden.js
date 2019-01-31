var express = require('express');
var router = express.Router();
var login = require('./login').router
var { getSecret } = require('./login')
//var { requestWS } = require('./webservice')
var { requestWS } = require('nodejs_idempierewebservice')
var { pool, url } = require('../util/DB.js');

/**
 * Ruta que retorna la orden de un id dado
 */
router.get('/orden/:documentno/', login.validarSesion, async function (req, res, next) {
    try {
        var orden = req.params.documentno;
        orden = orden.length >= 25 ? "" : orden;  
        var query = `
        select
            o.C_Order_ID,
            o.documentno,
            o.POReference as referencia_orden,
            o.description as descripcion,
            TO_CHAR(o.DateOrdered, 'YYYY/MM/DD') as fecha_orden,
            o.docstatus as estado_orden,
            o.totallines as subtotal_orden,
            o.grandtotal::text as total_orden,
            pac.FirstName1||' '||pac.LastName1 as paciente,
            o.grandtotal as total,
            o.TotalAdvance as anticipo_aceptado,	
            ol.C_OrderLine_ID,
            coalesce(p.name, c.name) as producto_cargo,
            ol.QtyEntered::integer as cantidad,
            ol.description as descripcion,
            ol.PriceEntered as precio,
            ol.discountamt as descuento,
            ol.DiscountPercAccepted as descuento_aceptado,
            ol.linenetamt as neto_linea
        from C_Order o
        left join C_OrderLine ol on ol.C_Order_ID = o.C_Order_ID and ol.isactive = 'Y'
        left join M_Product p on p.M_Product_ID = ol.M_Product_ID
        left join C_Charge c on c.C_Charge_ID = ol.C_Charge_ID
        left join AU_Patient pac on pac.AU_Patient_ID = o.AU_Patient_ID
        where o.documentno = ('${orden}')::text        
        `;

        var data = await pool.query(query);
        
        res.set('Cache-Control', 'private, max-age=8');
        res.json(parseDBdata(data));
    
    } catch (e) { next(e) }
})

router.put("/orden/:id/", login.validarSesion, async (req, res, next) => {
    try {
        var lineas = [...req.body.lineas] //{name: "asdas", value: 1.232}
        var anticipo_aceptado = Number(req.body.anticipo_aceptado)
        var id = Number(req.params.id)

        console.log(lineas, anticipo_aceptado, id);

        var {user, password} = await getSecret(req.session_itsc.ad_user_id);
        var context = {...req.session_itsc, username: user, password}

        var params = [
            {column: "C_Order_ID", val: id},
            {column: "TotalAdvance", val: anticipo_aceptado},
            {column: "lineas_orden_id", val: lineas.map(l => l.name).join("_")},
            {column: "descuentos", val: lineas.map(l => l.value).join("_")}
        ]

        var data = await requestWS(url, "ActualizarOrdenVenta WS", context, params)
        res.send(data);

    } catch (e) {
        console.log("error", e);
        res.status(500).send(''+e);
        //next (e) 
    }    
})


function parseDBdata (data) {
    return {
        fields: data.fields.map(f => f.name),
        rows: data.rows
    }
}


module.exports = router;