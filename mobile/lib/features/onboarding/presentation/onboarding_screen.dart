import 'package:flutter/material.dart';

import '../../../app/application/app_flow_scope.dart';
import '../../../app/navigation/app_routes.dart';
import '../../../shared/widgets/ct_buttons.dart';
import '../../../shared/widgets/ct_brand_header.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  static const _slides = [
    (
      title: 'Welcome to CloudTune',
      subtitle: 'Your music world in one place.',
      body: 'Stream, discover, and keep your favorite tracks synced across your devices.'
    ),
    (
      title: 'Offline-ready listening',
      subtitle: 'Take your playlists with you.',
      body: 'Download songs for commutes, flights, and low-signal places without missing the beat.'
    ),
    (
      title: 'Smart premium experience',
      subtitle: 'Flexible plans, ad-light free tier.',
      body: 'Upgrade when ready and unlock ad-free sessions, higher quality audio, and more storage.'
    ),
  ];

  void _next() {
    if (_index == _slides.length - 1) {
      AppFlowScope.of(context).completeOnboarding();
      Navigator.of(context).pushReplacementNamed(AppRoutes.login);
      return;
    }

    _controller.nextPage(
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CtBrandHeader(
                title: _slides[_index].title,
                subtitle: _slides[_index].subtitle,
              ),
              const SizedBox(height: 22),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _slides.length,
                  onPageChanged: (value) => setState(() => _index = value),
                  itemBuilder: (context, index) => Align(
                    alignment: Alignment.topLeft,
                    child: Text(
                      _slides[index].body,
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                ),
              ),
              Row(
                children: List.generate(
                  _slides.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(right: 8),
                    width: _index == index ? 26 : 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: _index == index
                          ? theme.colorScheme.primary
                          : theme.colorScheme.outlineVariant,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              CtPrimaryButton(
                label: _index == _slides.length - 1 ? 'Get started' : 'Continue',
                onPressed: _next,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
