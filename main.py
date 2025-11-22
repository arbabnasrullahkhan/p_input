# Advanced Python interactivity for the presentation
# This script can be integrated with PyScript or used as a backend

class PresentationAnalytics:
    """Track and analyze presentation interaction"""
    
    def __init__(self):
        self.slide_views = {}
        self.total_views = 0
        self.start_time = None
        self.end_time = None
    
    def track_slide_view(self, slide_num):
        """Track when a slide is viewed"""
        if slide_num not in self.slide_views:
            self.slide_views[slide_num] = 0
        self.slide_views[slide_num] += 1
        self.total_views += 1
        return self.slide_views[slide_num]
    
    def get_most_viewed_slide(self):
        """Get the most viewed slide"""
        if not self.slide_views:
            return None
        return max(self.slide_views, key=self.slide_views.get)
    
    def get_view_stats(self):
        """Get statistics about slide views"""
        return {
            'total_views': self.total_views,
            'most_viewed': self.get_most_viewed_slide(),
            'view_breakdown': self.slide_views
        }


class InteractiveQuiz:
    """Interactive quiz functionality for presentations"""
    
    def __init__(self):
        self.questions = [
            {
                'id': 1,
                'question': 'What does a keyboard allow users to do?',
                'options': ['Enter text and commands', 'Move objects', 'Take photos', 'Record audio'],
                'answer': 0
            },
            {
                'id': 2,
                'question': 'Which device captures audio input?',
                'options': ['Keyboard', 'Mouse', 'Microphone', 'Scanner'],
                'answer': 2
            },
            {
                'id': 3,
                'question': 'What is a touchscreen used for?',
                'options': ['Printing', 'Direct interaction', 'Audio capture', 'Video output'],
                'answer': 1
            }
        ]
        self.scores = {}
    
    def submit_answer(self, user_id, question_id, selected_answer):
        """Submit and check an answer"""
        if user_id not in self.scores:
            self.scores[user_id] = {'correct': 0, 'total': 0}
        
        question = next((q for q in self.questions if q['id'] == question_id), None)
        if not question:
            return False
        
        self.scores[user_id]['total'] += 1
        is_correct = selected_answer == question['answer']
        if is_correct:
            self.scores[user_id]['correct'] += 1
        
        return is_correct
    
    def get_score(self, user_id):
        """Get user's quiz score"""
        if user_id not in self.scores:
            return {'correct': 0, 'total': 0, 'percentage': 0}
        
        score = self.scores[user_id]
        percentage = (score['correct'] / score['total'] * 100) if score['total'] > 0 else 0
        return {
            'correct': score['correct'],
            'total': score['total'],
            'percentage': round(percentage, 2)
        }


class AnimationEffects:
    """Generate dynamic animation effects"""
    
    @staticmethod
    def get_pulse_animation(delay=0):
        """Get pulse animation CSS"""
        return f"animation: pulse 2s infinite; animation-delay: {delay}s;"
    
    @staticmethod
    def get_bounce_animation(delay=0):
        """Get bounce animation CSS"""
        return f"animation: bounce 1s infinite; animation-delay: {delay}s;"
    
    @staticmethod
    def get_fade_in_animation(duration=1):
        """Get fade-in animation CSS"""
        return f"animation: fadeIn {duration}s ease-in;"
    
    @staticmethod
    def get_slide_in_animation(direction='left', duration=0.8):
        """Get slide-in animation CSS"""
        return f"animation: slideIn{direction.capitalize()} {duration}s ease-out;"


class PresenterMode:
    """Features for presenter mode"""
    
    def __init__(self):
        self.is_presenting = False
        self.notes = {}
        self.timer_start = None
    
    def get_presenter_notes(self, slide_num):
        """Get notes for a specific slide"""
        return self.notes.get(slide_num, "No notes available")
    
    def start_timer(self):
        """Start presentation timer"""
        import time
        self.timer_start = time.time()
    
    def get_elapsed_time(self):
        """Get elapsed presentation time in seconds"""
        import time
        if self.timer_start is None:
            return 0
        return round(time.time() - self.timer_start)


# Example usage and demonstrations
if __name__ == "__main__":
    # Initialize components
    analytics = PresentationAnalytics()
    quiz = InteractiveQuiz()
    effects = AnimationEffects()
    presenter = PresenterMode()
    
    # Demo: Track slide views
    print("=== Analytics Demo ===")
    for i in range(1, 5):
        analytics.track_slide_view(i)
    analytics.track_slide_view(2)
    print(f"Most viewed slide: {analytics.get_most_viewed_slide()}")
    print(f"Stats: {analytics.get_view_stats()}")
    
    # Demo: Quiz
    print("\n=== Quiz Demo ===")
    quiz.submit_answer("user1", 1, 0)  # Correct
    quiz.submit_answer("user1", 2, 1)  # Wrong
    quiz.submit_answer("user1", 3, 1)  # Correct
    print(f"User1 Score: {quiz.get_score('user1')}")
    
    # Demo: Animation
    print("\n=== Animation Demo ===")
    print(f"Pulse: {effects.get_pulse_animation(0.2)}")
    print(f"Fade In: {effects.get_fade_in_animation(1.5)}")

