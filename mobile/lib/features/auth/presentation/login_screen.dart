import 'package:flutter/material.dart';

import '../../../app/application/app_flow_scope.dart';
import '../../../app/navigation/app_routes.dart';
import '../../../shared/widgets/ct_buttons.dart';
import '../../../shared/widgets/ct_brand_header.dart';
import '../../../shared/widgets/ct_inputs.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _login() {
    AppFlowScope.of(context).login();
    Navigator.of(context).pushReplacementNamed(AppRoutes.main);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const CtBrandHeader(
              title: 'Welcome back',
              subtitle: 'Sign in to continue your listening journey.',
            ),
            const SizedBox(height: 24),
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
              label: 'Sign in',
              icon: Icons.login_rounded,
              onPressed: _login,
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('New to CloudTune?', style: theme.textTheme.bodyMedium),
                TextButton(
                  onPressed: () => Navigator.of(context).pushNamed(AppRoutes.signup),
                  child: const Text('Create account'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
