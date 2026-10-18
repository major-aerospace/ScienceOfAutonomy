"""Versioned formative course keys; these are not aptitude or selection scores.

Keep each published version immutable. A changed question or answer key requires
a new content version so previously saved attempts remain reproducible.
"""
from types import MappingProxyType

CONTENT_VERSION = "foundations-1"
ASSIGNMENT_ID = "autonomy-foundations"
LESSON_KEYS = MappingProxyType({
    "sense": (1, 0),
    "feedback": (1, 0),
    "uncertainty": (1, 0),
    "planning": (1, 0),
    "human": (1, 0),
    "systems": (1, 0),
})
LESSON_TITLES = MappingProxyType({
    "sense": "From sensing to action",
    "feedback": "Make a correction. Observe again.",
    "uncertainty": "A reading is not the whole truth",
    "planning": "The shortest route is not always the right one",
    "human": "Know when to ask for help",
    "systems": "One successful run is a beginning",
})
CHECK_TOPICS = MappingProxyType({
    "sense": ("Sensing and decision making", "Closing the observation loop"),
    "feedback": ("Calculating feedback error", "Correction strength and oscillation"),
    "uncertainty": ("Shared measurement offsets", "The limits of averaging"),
    "planning": ("Objectives and hard constraints", "Reconsidering a blocked plan"),
    "human": ("Useful requests for human help", "Preparing for an unavailable supervisor"),
    "systems": ("Untested conditions", "Reporting evidence and limitations"),
})
