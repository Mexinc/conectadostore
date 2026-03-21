interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  available: {
    label: "Disponível",
    className: "bg-status-available/15 text-status-available",
  },
  reserved: {
    label: "Reservado",
    className: "bg-status-reserved/15 text-status-reserved",
  },
  sold: {
    label: "Vendido",
    className: "bg-status-sold/15 text-status-sold",
  },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusMap[status] || statusMap.available;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
