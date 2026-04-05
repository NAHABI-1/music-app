import 'package:flutter/material.dart';

import '../../../shared/widgets/progress_upload_card.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class UploadMusicScreen extends StatefulWidget {
  const UploadMusicScreen({super.key});

  @override
  State<UploadMusicScreen> createState() => _UploadMusicScreenState();
}

class _UploadMusicScreenState extends State<UploadMusicScreen> {
  static const int _maxRetryAttempts = 3;
  final List<_UploadTask> _uploads = <_UploadTask>[];

  void _simulateUpload() {
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    final task = _UploadTask(
      id: id,
      fileName: 'Track ${_uploads.length + 1}.mp3',
      progress: 0,
      status: 'Queued',
      state: _UploadTaskState.queued,
    );

    setState(() {
      _uploads.insert(0, task);
    });

    _startTask(task, fromRetry: false);
  }

  Future<void> _startTask(_UploadTask task, {required bool fromRetry}) async {
    final index = _uploads.indexWhere((u) => u.id == task.id);
    if (index < 0) {
      return;
    }

    setState(() {
      _uploads[index] = _uploads[index].copyWith(
        state: _UploadTaskState.uploading,
        status: fromRetry ? 'Retrying upload...' : 'Uploading...',
        clearError: true,
      );
    });

    while (mounted) {
      await Future<void>.delayed(const Duration(milliseconds: 350));
      final currentIndex = _uploads.indexWhere((u) => u.id == task.id);
      if (currentIndex < 0) {
        return;
      }

      final current = _uploads[currentIndex];
      if (current.state != _UploadTaskState.uploading) {
        return;
      }

      final nextProgress = (current.progress + 0.08).clamp(0.0, 1.0);

      if (current.retryCount == 0 && nextProgress >= 0.6 && nextProgress < 0.7) {
        setState(() {
          _uploads[currentIndex] = current.copyWith(
            state: _UploadTaskState.failed,
            status: 'Network error. Tap retry.',
            errorMessage: 'Temporary network issue',
          );
        });
        return;
      }

      setState(() {
        _uploads[currentIndex] = current.copyWith(
          progress: nextProgress,
          status: nextProgress >= 1.0 ? 'Processing...' : 'Uploading...',
        );
      });

      if (nextProgress >= 1.0) {
        break;
      }
    }

    if (!mounted) {
      return;
    }

    await Future<void>.delayed(const Duration(milliseconds: 700));
    if (!mounted) {
      return;
    }

    final doneIndex = _uploads.indexWhere((u) => u.id == task.id);
    if (doneIndex < 0) {
      return;
    }

    setState(() {
      _uploads[doneIndex] = _uploads[doneIndex].copyWith(
        state: _UploadTaskState.completed,
        status: 'Upload complete',
        progress: 1,
      );
    });
  }

  void _retryUpload(String taskId) {
    final index = _uploads.indexWhere((u) => u.id == taskId);
    if (index < 0) {
      return;
    }

    final current = _uploads[index];
    if (current.retryCount >= _maxRetryAttempts) {
      setState(() {
        _uploads[index] = current.copyWith(
          status: 'Max retries reached. Remove and re-upload.',
          errorMessage: 'Retry limit exceeded',
        );
      });
      return;
    }

    final updated = current.copyWith(
      retryCount: current.retryCount + 1,
      state: _UploadTaskState.queued,
      status: 'Queued',
      progress: current.progress.clamp(0.0, 0.2),
      clearError: true,
    );

    setState(() {
      _uploads[index] = updated;
    });

    _startTask(updated, fromRetry: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Music'),
      ),
      body: _uploads.isEmpty
          ? EmptyStateWidget(
              icon: Icons.upload_file_rounded,
              title: 'No uploads yet',
              description: 'Share your music with CloudTune. Premium members get 25GB storage!',
              action: FilledButton.icon(
                onPressed: _simulateUpload,
                icon: const Icon(Icons.add_rounded),
                label: const Text('Choose File'),
              ),
            )
          : SingleChildScrollView(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _simulateUpload,
                        icon: const Icon(Icons.add_rounded),
                        label: const Text('Add Music'),
                      ),
                    ),
                  ),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _uploads.length,
                    itemBuilder: (context, index) {
                      final upload = _uploads[index];
                      return ProgressUploadCard(
                            fileName: upload.fileName,
                            progress: upload.progress,
                            status: upload.status,
                            onRetry: upload.state == _UploadTaskState.failed
                                ? () => _retryUpload(upload.id)
                                : null,
                            onCancel: () {
                              setState(() => _uploads.removeAt(index));
                            },
                          );
                    },
                  ),
                ],
              ),
            ),
    );
  }
}

enum _UploadTaskState {
  queued,
  uploading,
  failed,
  completed,
}

class _UploadTask {
  const _UploadTask({
    required this.id,
    required this.fileName,
    required this.progress,
    required this.status,
    required this.state,
    this.errorMessage,
    this.retryCount = 0,
  });

  final String id;
  final String fileName;
  final double progress;
  final String status;
  final _UploadTaskState state;
  final String? errorMessage;
  final int retryCount;

  _UploadTask copyWith({
    double? progress,
    String? status,
    _UploadTaskState? state,
    String? errorMessage,
    bool clearError = false,
    int? retryCount,
  }) {
    return _UploadTask(
      id: id,
      fileName: fileName,
      progress: progress ?? this.progress,
      status: status ?? this.status,
      state: state ?? this.state,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      retryCount: retryCount ?? this.retryCount,
    );
  }
}
