import 'package:flutter/material.dart';

import '../../../app/application/app_flow_scope.dart';
import '../../../app/navigation/app_routes.dart';
import '../../../shared/widgets/ct_buttons.dart';
import '../../../shared/widgets/ct_brand_header.dart';
import '../../../shared/widgets/ct_inputs.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _signup() {
    AppFlowScope.of(context).login();
    Navigator.of(context).pushNamedAndRemoveUntil(AppRoutes.main, (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const CtBrandHeader(
              title: 'Create account',
              subtitle: 'Start curating your CloudTune experience.',
            ),
            const SizedBox(height: 24),
            CtTextField(label: 'Display name', controller: _name),
            const SizedBox(height: 12),
            CtTextField(
              label: 'Email',
              controller: _email,
              textInputType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            CtTextField(
              label: 'Password',
              controller: _password,
              obscureText: true,
            ),
            const SizedBox(height: 18),
            CtPrimaryButton(
              label: 'Create account',
              icon: Icons.person_add_alt_1_rounded,
              onPressed: _signup,
            ),
            const SizedBox(height: 8),
            Text(
              'By continuing you agree to the CloudTune Terms and Privacy Policy.',
              style: theme.textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
