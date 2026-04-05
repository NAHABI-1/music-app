class PlanOffer {
  const PlanOffer({
    required this.code,
    required this.name,
    required this.subtitle,
    required this.priceLabel,
    required this.intervalLabel,
    required this.highlight,
    required this.recommended,
  });

  final String code;
  final String name;
  final String subtitle;
  final String priceLabel;
  final String intervalLabel;
  final String highlight;
  final bool recommended;
}
