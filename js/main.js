
addEventListener('DOMContentLoaded', async(e)=>{
    let peticion = await fetch('./config.json');
    let data = await peticion.json();
    console.log(data);


    document.querySelector("#tipoDeFactura").insertAdjacentText('afterbegin', data.Informacion['Tipo-De-Factura']);

    //Creacion de etiqueta para el iconoco en el head
    let link = document.createElement('LINK');
    let myLinkObj = {
        rel: "shorcut icon",
        href: data.Header.Logo,
        type: "image.jpg"
    }
    Object.assign(link, myLinkObj);
    document.head.insertAdjacentElement('beforeend', link);
    //Creacion de la etiqueta para la imagen en la parte del header del body
    let img = document.createElement('IMG');
    img.src = data.Header.Logo;
    img.width = "97";

    document.querySelector("#logo").insertAdjacentElement('afterbegin', img);
    //Ejemplo con plantilla usando backstick
    let headerEmpresa = `
    <strong>${data.Header.Empresa.Nombre}</strong><br>
        ${data.Header.Empresa.NIT}<br>
        ${data.Header.Empresa.Direccion}<br>
        ${data.Header.Empresa.Departamento}<br>`;
    document.querySelector("#headerEmpresa").insertAdjacentHTML('afterbegin', headerEmpresa);
    //Creacion de elemento title para el head
    let title = document.createElement('TITLE');
    title.insertAdjacentText('afterbegin', data.Header.Empresa.Nombre);

    document.head.insertAdjacentElement('afterbegin', title);
    //Creacion para editar el header contactos section del body
    let fragment = document.createDocumentFragment();
    let p = document.createElement('P');
    fragment.append(p);
    for(let key in data.Header.Contactos){
        let texto= document.createTextNode(`${key}: `);
        fragment.children[0].appendChild(texto);
        for(let [id, value] of Object.entries(data.Header.Contactos[key])){
            let a = document.createElement('A');
            let br = document.createElement('BR');
            a.href = value.Valor;
            a.insertAdjacentText('afterbegin', value.Nombre);
            fragment.children[0].appendChild(a);
            fragment.children[0].appendChild(br);
        }
    }
    document.querySelector("#headerContactos").insertAdjacentElement('afterbegin', fragment.children[0]);

    //Relleno parte del header de los bancos
    // let datosBancarios = `    Datos bacarios: ${data['Header']['Token-Verificacion']['Nombre-Banco']} <br>
    // Titular de la cuenta: ${data['Header']['Token-Verificacion']['Nombre-Titular']} <br>
    // IBAN: ${data['Header']['Token-Verificacion']['Producto']}<br>
    // BIC: ${data['Header']['Token-Verificacion']['Cuenta-Bancaria']}`;
    // document.querySelector("#datosBancarios").insertAdjacentHTML('afterbegin', datosBancarios);
    // Codigo de qr
    qr = new QRious({
        element: document.getElementById('qr-code'),
        value: JSON.stringify(data.Header["Token-Verificacion"])
    });
    qr.set({
        foreground: '#000096',
        size: 150,
        background: '#ffffff'
    });

    //Seccion FACTURAINFO
    // let facturaInfo = `Fecha: ${data['Section-Autorizacion']['Facturado']['FechaDeFactura']}<br>
    // Factura#: ${data['Section-Autorizacion']['Facturado']['NumeroDeFactura']}<br>
    // Vence: ${data['Section-Autorizacion']['Facturado']['FechaDeVencimiento']}.
    // `;
    // document.querySelector("#facturaInfo").insertAdjacentHTML('afterbegin',facturaInfo);
    // Codigo de barras
    JsBarcode("#barcode", JSON.stringify(data['Section-Autorizacion'].Facturado['NumeroDeFactura']), {
        lineColor: '#000096',
        height: 40,
        width: 1.5,
        displayValue: false,
        background: '#ffffff'});
    //Seccion FACTURAR A
    let responsable = `
    <strong>Facturar a</strong><br>
    ${data['Section-Autorizacion']['Responsable']['Nombre']}<br>
    ${data['Section-Autorizacion']['Responsable']['Empresa']}<br>
    ${data['Section-Autorizacion']['Responsable']['DireccionCompleta']}<br>
    `;
    document.querySelector("#responsable").insertAdjacentHTML('afterbegin',responsable);

    //Seccion APROBADO POR
    let aprobado =`
    <strong>Aprobador por </strong><br>
    ${data['Section-Autorizacion']['Autorizacion']['Nombre']}<br>
    ${data['Section-Autorizacion']['Autorizacion']['Empresa']}<br>
    ${data['Section-Autorizacion']['Autorizacion']['Dirrecion-Completa']}<br>
    `
    document.querySelector("#aprobado").insertAdjacentHTML('afterbegin',aprobado);

    //Lista PROVEEDORES
    let ListaProvedores = ``;
    for(let [id, value] of Object.entries(data['Section-Detalle'].Proveedor)){
        ListaProvedores += `
        <tr class="invoice_detail">
            <td width="20%"><a class="control removeRow" >x</a><span contenteditable>${value['N-Vendedor']}</span></td>
            <td width="22%" style="text-align:center;"><span contenteditable>${value['Nombre']}</span></td>
            <td width="22%"><span contenteditable>${value['Orden-Compra']}</span></td>
            <td width="36%"><span contenteditable>${value['Términos-y-condiciones']}</span></td>
        </tr>`
    }
    document.querySelector("#sectionDetalleProveedor").insertAdjacentHTML('afterbegin', ListaProvedores);
    //Eliminar fila de la tabla proveedor
    document.querySelector("#sectionDetalleProveedor").addEventListener("click", (e)=>{
        if(e.target.nodeName == "A"){
            e.target.parentNode.parentNode.remove();
        }
        e.preventDefault();
    })
    //Nueva fila del proveedor
    document.querySelector("#nuevaFilaVendedor").addEventListener("click", (e)=>{
        let plantilla = `
        <tr class="invoice_detail">
            <td width="20%"><a class="control removeRow" >x</a><span contenteditable>Codigo</span></td>
            <td width="22%" style="text-align:center;"><span contenteditable>Nombre Completo</span></td>
            <td width="22%"><span contenteditable>Generar Orden</span></td>
            <td width="34%"><span contenteditable>Medio de pago</span></td>
        </tr>
        `;
        document.querySelector("#sectionDetalleProveedor").insertAdjacentHTML('beforeend', plantilla);
        e.preventDefault();
    })

    let subTotal = 0;
    let TotalApagarIva = 0;
    let ListaCompra = "";
    let subTotalIva=0;
    for(let [id, value] of Object.entries(data['Section-Detalle'].Compra)){
        subTotalIva = value.Precio * ((value.Iva/100) * value.Cantidad);
        TotalApagarIva += subTotalIva;
        let iva = (value.Precio * value.Cantidad) + subTotalIva;
        subTotal += iva;
        ListaCompra += `
        <tr>
          <td width='5%'><a class="control removeRow">x</a> <span contenteditable>${value['N-Vendedor']}</span></td>
          <td width='5%'><span contenteditable>${value.Codigo}</span></td>
          <td width='50%'><textarea rows="1" >${value.Descripcion}</textarea></td>
          <td class="amount"><input type="text" value="${value.Cantidad}" /></td>
          <td width="20%" class="rate"><input type="text" value="${new Intl.NumberFormat("de-DE").format(value.Precio)}" /></td>
          <td width="18%" class="tax taxrelated"><input type="text" value="${value.Iva}" /></td>
          <td width="10%" class="sum">${new Intl.NumberFormat("de-DE").format(iva)}</td>
        </tr>`;
    }
    document.querySelector("#sectionDetalleCompra").insertAdjacentHTML('afterbegin', ListaCompra);
    document.querySelector("#ivaApagar").insertAdjacentHTML('afterbegin', data.Iva);
    document.querySelector("#totalApagar").insertAdjacentText('afterbegin', new Intl.NumberFormat("de-DE").format(subTotal + (subTotal * (data.Iva / 100))));
    document.querySelector("#subIvaApagar").innerHTML = "";
    document.querySelector("#subIvaApagar").insertAdjacentText('afterbegin', new Intl.NumberFormat("de-DE").format(TotalApagarIva));
    //Interaccion de botones para agregar o quitar
    let tbCompras = '#sectionDetalleCompra';
    let calcularFactura = (e)=>{
        let listaNodos = document.querySelectorAll(`[id="sectionDetalleCompra"] tr td input, .sum`);
        let valor = [];
        let subTotal = 0;
        let subTotalIva = 0;
        let TotalApagarIva = 0;
        for(let [id, valu] of Object.entries(listaNodos)){
            if(valu.nodeName!="TD"){
                valu.value = new Intl.NumberFormat("de-DE").format(valu.value.replace(/[$.]/g,''));
                valor.push(parseInt(valu.value.replace(/[$.]/g,'')));
            }else{
                console.log(valor);
                subTotalIva = (valor[1] * (valor[2] / 100)) * valor[0];
                TotalApagarIva += subTotalIva;
                let iva=  (valor[1] * valor[0]) + subTotalIva;
                valu.textContent = new Intl.NumberFormat("de-DE").format(iva);
                subTotal += iva;
                valor = [];
            }
        }
        document.querySelector("#totalApagar").innerHTML = "";
        document.querySelector("#subIvaApagar").innerHTML = "";
        document.querySelector("#subIvaApagar").insertAdjacentText('afterbegin', new Intl.NumberFormat("de-DE").format(TotalApagarIva));
        document.querySelector("#totalApagar").insertAdjacentText('afterbegin', new Intl.NumberFormat("de-DE").format(subTotal + (subTotal * (data.Iva / 100))));
    }
    document.querySelector(tbCompras).addEventListener("change", (e)=>{
        calcularFactura(e);
    })
    document.querySelector(tbCompras).addEventListener("click", (e)=>{
        if(e.target.nodeName == "A"){
            e.target.parentNode.parentNode.remove();
            calcularFactura(e);
        }
        e.preventDefault();
    })

    
    
    document.querySelector("#nuevaFilaCompra").addEventListener("click", (e)=>{
        let plantilla = `<tr>
        <td width='5%'><a class="control removeRow">x</a> <span contenteditable>N° Vendedor</span></td>
        <td width='5%'><span contenteditable>Código</span></td>
        <td width='60%'><textarea rows="1">Descripción del producto</textarea></td>
        <td class="amount"><input type="text" value="0"/></td>
        <td width="20%" class="rate"><input type="text" value="0" /></td>
        <td width="15%" class="tax taxrelated"><input type="text" value="0" /></td>
        <td width="10%" class="sum">0</td>
        </tr>`;
        document.querySelector("#sectionDetalleCompra").insertAdjacentHTML('beforeend', plantilla);
        e.preventDefault();
    })
    
    document.querySelector("#FooterMensaje").insertAdjacentText('afterbegin', data.Footer.Mensaje);

});