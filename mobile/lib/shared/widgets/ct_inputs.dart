import 'package:flutter/material.dart';

class CtTextField extends StatelessWidget {
  const CtTextField({
    super.key,
    required this.label,
    required this.controller,
    this.obscureText = false,
    this.textInputType,
  });

  final String label;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType? textInputType;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: textInputType,
      decoration: InputDecoration(
        labelText: label,
      ),
    );
  }
}
