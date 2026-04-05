import '../data/services/scaffold_monetization_api.dart';
import 'monetization_controller.dart';

Future<MonetizationController> createDefaultMonetizationController() async {
  final controller = MonetizationController(api: ScaffoldMonetizationApi());
  await controller.initialize();
  return controller;
}
