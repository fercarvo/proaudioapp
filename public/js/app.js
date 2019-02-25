
angular.module('app', ['ui.router'])
    .config(["$stateProvider", "$compileProvider", "$urlRouterProvider", "$httpProvider" , function ($stateProvider, $compileProvider, $urlRouterProvider, $httpProvider) {
        $stateProvider
            .state('orden', {
                url: "/orden",
                templateUrl: '/views/orden/buscar.html',
                controller: 'orden'
            })
            .state('orden_detalle', {
                url: "/orden/:id",
                templateUrl: '/views/orden/detalle.html',
                controller: 'orden_detalle'
            })
        
        $urlRouterProvider.otherwise('/orden');

        $httpProvider.interceptors.push(['$q', function($q) {
            return {
                'responseError': function(response) {
                    if (response.status === 401) {
                        window.location.replace(`/logout/`)
                    }
    
                    return $q.reject(response);
                }
            };
        }]);
         
    }])
    .run(["$state", "$http", "$templateCache", function ($state, $http, $templateCache) {
        loadTemplates($state, "orden", $http, $templateCache)
        $http.post("/auth").then().catch(e => {
            console.log(e)
            window.location.replace(`/login/`)
        })

    }])

    .controller('orden', ["$scope", "$http", "$state", function($scope, $http, $state){
        $scope.buscarOrden = id => $state.go("orden_detalle", {id});
        
    }])
    .controller('orden_detalle', ["$scope", "$state", "$stateParams", "$http", function($scope, $state, $stateParams, $http){

        $scope.ordendoc = $stateParams.id
        $scope.orden = {}
        $scope.error = {
            show: false,
            msg: null
        }

        var url = `/orden/${$scope.ordendoc}/`
        var tabla;

        $http.get(url)
        .then(async res => {
            console.log(res.data)

            $scope.orden = res.data.rows[0]

            tabla = await cargarTabla('lineas_orden', res.data, [
                {name: 'producto_cargo', alias: 'Producto/Cargo'},
                {name: 'cantidad', alias: 'Cantidad'},
                {name: 'descripcion', alias: 'Descripción'},
                {name: 'precio', alias: 'Precio'},
                {name: 'neto_linea', alias: 'Neto Linea'},
                {name: 'descuento', alias: 'descuento'},
                {alias: '% Descuento Aceptado', cb: row => `<input form="actualizar" value="${row.descuento_aceptado}" name="${row.c_orderline_id}" required title="Numeros con punto (.) separador decimal" pattern="[0-9.]+" type="text" style="width:100%;" />`},
            ])


        }).catch(e => {
            alert("Un error ha ocurrido")
            $state.go("orden")
        })

        $scope.submit_actualizar = function () {
            $scope.error.show = false
            $scope.error.msg = null

            //if (confirm("Esta seguro que desea actualizar la orden?")) {

                if (window['waitingDialog']) {
                    waitingDialog.show(`Procesando`);
                }

                document.body.style.pointerEvents = "none" //Se bloquean los clicks

                var data = $("input[form='actualizar']:visible").serializeArray()

                var lineas = data.filter(el => el.name !== "anticipo_aceptado")
                var anticipo_aceptado = data.filter(el => el.name === "anticipo_aceptado")[0].value

                $http.put(`/orden/${$scope.orden.c_order_id}/`, {lineas, anticipo_aceptado}).then(res => {
                    console.log(res.data)

                    if (window['waitingDialog']) {
                        waitingDialog.hide();
                    }

                    alert(res.data)
                    $state.reload();
                    document.body.style.pointerEvents = "all" //Se activan nuevamente los clicks                  

                }).catch(e => {
                    console.log(e)

                    if (window['waitingDialog']) {
                        waitingDialog.hide();
                    }

                    alert("Error: "+e.data)
                    $scope.error.show = true
                    $scope.error.msg = e.data
                    document.body.style.pointerEvents = "all" //Se activan nuevamente los clicks
                
                })
            //}            
        }

        $scope.$on("$destroy", function () { 
            if (tabla) {
                console.log("destruyendo tabla...")
                tabla.destroy()
            }
        })

    }])



async function loadTemplates($state, goState, $http, $templateCache) {
    try {
        var promises = []
        var states = $state.get()

        for (i = 1; i < states.length; i++) {
            var p = $http.get(states[i].templateUrl, { cache: $templateCache })
            promises.push(p)
            p.then(function () { }, function (error) { console.log("Error template: ", error) })
        }

        await Promise.all(promises)
                
    } catch (e) {
        console.log("Error templates catch: " + e)
    } finally {
        //$state.go(goState) ///////////////////////// State inicial
        document.body.style.pointerEvents = "all"
    }
    
}


async function cargarTabla (id, url, arrColumnas) {
    try {
        var data;
        if (url instanceof String) {
            data = await fetch(url, {credentials: "same-origin"})

            if (data.ok)
                data = await data.json();
            else
                throw new Error(`Status: ${data.status}, ${data.statusText}`);
        } else {
            data = url
        }        

        document.getElementById(id).innerHTML = `
            <thead>
                <tr>
                    ${arrColumnas.reduce((html, obj) => {
                        return html + `<th> ${obj.alias} </th>`;
                    }, '')}
                </tr>
            </thead>
            <tbody>
                ${data.rows.reduce((html, row, index, arr) => {
                    return html + `
                        <tr> 
                            ${arrColumnas.reduce((htmlr, obj) => {
                                return htmlr + `
                                <td> ${obj.name ? (row[obj.name] || '') : obj.cb(row, index, arr)} </td>`;        
                            }, '')}
                        </tr>`;
                }, '')}
            </tbody>
        `;
        
        return $(`#${id}`).DataTable({ 
            responsive: true,
            searching: false,
            paging: false,
            language: {
                "emptyTable":   	"No existe información para mostrar",
                "info":         	"",//"Mostrando página _PAGE_ de _PAGES_",
                "infoEmpty":    	"No existe información para mostrar",
                "infoFiltered": 	"(Filtrado de _MAX_ registros)",
                "lengthMenu":   	"Mostrar _MENU_ registros por página",
                "search":       	"Buscar",
                "zeroRecords":  	"La busqueda no encontró resultados",
                "paginate": {
                    "first":    	"Primero",
                    "previous": 	"Anterior",
                    "next":     	"Siguiente",
                    "last":     	"Último"
                }
            }
         })

    } catch (e) {
        console.log(e);
        alert(e.message)
        return undefined
    }
}

function escribir( json ) {
    return window.btoa(unescape(encodeURIComponent( JSON.stringify(json) )));
}

function leer( str ) {
    return JSON.parse( decodeURIComponent(escape(window.atob( str ))) )
}
