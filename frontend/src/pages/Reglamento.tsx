export default function Reglamento() {
  const condiciones = [
    "El remate se realiza en forma online exclusivamente.",
    "Una semana antes de la subasta los clientes tendrán en nuestra web el catálogo con fotos y videos de cada uno de los lotes a subastar.",
    "Cada uno será explicado detalladamente por el martillero 30 minutos antes de la subasta; los clientes podrán interactuar con el martillero.",
    "Para poder participar de la subasta los clientes tendrán que llenar un formulario de inscripción completando los datos solicitados en el botón Registrarse.",
    "Posteriormente deben enviar un WhatsApp donde se les pedirá que hagan una transferencia bancaria y se les dará crédito para poder comprar.",
    "Si no adquirió ningún lote se devuelve el total de la seña entregada o bien queda para otra subasta.",
    "El valor total de la venta se compone de la mejor postura más el 10% de comisión.",
    "Finalizada la subasta los compradores recibirán un resumen con los lotes comprados y el saldo a pagar; al día siguiente nos comunicamos para coordinar la entrega de los bienes.",
    "La falta de pago en tiempo y forma significará para el comprador la pérdida, sin más trámites y sin necesidad de aviso o intimación alguna, de los importes entregados en concepto de seña.",
    "Los gastos ocasionados para el desmonte y retiro de los bienes adquiridos corren por cuenta de los compradores, comprometiéndose a dejar el lugar en las mejores condiciones.",
    "En todos los casos las fotos, pesos y medidas serán aproximados.",
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Reglamento de remates online</h1>
      <p className="text-slate-600 mt-2">Condiciones generales para participar en las subastas de Tinban Remates.</p>

      <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-[#0b5ed7]">
          <h2 className="text-lg font-semibold text-white">Condiciones</h2>
        </div>
        <ol className="divide-y divide-slate-100 list-decimal list-inside">
          {condiciones.map((texto, i) => (
            <li
              key={i}
              className="px-4 py-4 text-slate-700 leading-relaxed"
            >
              <span className="ml-1">{texto}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
