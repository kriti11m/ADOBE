# src/relevance_analyzer.py
import os
import torch
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict

class RelevanceAnalyzer:
    """Figures out which sections are most relevant to the user's needs"""
    
    def __init__(self):
        try:
            print("Loading sentence transformer for semantic similarity...")
            self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Sentence transformer loaded successfully!")
        except Exception as e:
            print(f"Failed to load sentence transformer: {e}")
            raise
        
        # Initialize Gemini LLM integration
        self.use_gemini_enhancement = True
        try:
            # Import LLM service for Gemini integration
            import sys
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
            from chat_with_llm import get_llm_response
            self.llm_service = get_llm_response
            print("✅ Gemini LLM integration enabled for Part 1B analysis")
        except Exception as e:
            print(f"⚠️ Gemini LLM integration unavailable: {e}")
            self.use_gemini_enhancement = False
            self.llm_service = None

    def expand_job_context(self, job: str) -> List[str]:
        """Creates different ways of looking at the job description for better matching"""
        # Start with the original job description
        contexts = [job]
        
        # Break down the job into different parts
        job_words = job.split()
        
        # Look for important nouns (usually capitalized)
        nouns = [word for word in job_words if len(word) > 3 and word[0].isupper()]
        if nouns:
            contexts.append(f"focus on {nouns[0].lower()}")
        
        # Look for action words (ending in -ing or -ed)
        action_words = [word for word in job_words if word.endswith('ing') or word.endswith('ed')]
        if action_words:
            contexts.append(f"task involving {action_words[0]}")
        
        # Pure logic: Extract meaningful words (longer than 2 characters)
        job_lower = job.lower()
        job_words = [word for word in job_lower.split() if len(word) > 2]
        if job_words:
            contexts.append(' '.join(job_words))
        
        return contexts

    def gemini_enhanced_relevance_analysis(self, section_text: str, section_title: str, job: str, persona: str) -> Dict[str, any]:
        """
        Uses Gemini LLM to provide enhanced relevance analysis for Part 1B
        """
        if not self.use_gemini_enhancement or not self.llm_service:
            return {"relevance_score": 0.0, "reasoning": "Gemini LLM unavailable", "enhanced": False}
        
        try:
            # Create a focused prompt for relevance analysis
            prompt = f"""
            Analyze the relevance of this document section for a specific task:

            **Persona**: {persona}
            **Task**: {job}

            **Section Title**: {section_title}
            **Section Content**: {section_text[:1500]}...

            Provide a relevance analysis with:
            1. Relevance Score (0.0 to 1.0)
            2. Key reasons why this section is relevant/irrelevant
            3. Specific elements that match the task requirements

            Respond in this exact JSON format:
            {{
                "relevance_score": 0.85,
                "key_reasons": ["reason 1", "reason 2"],
                "matching_elements": ["element 1", "element 2"],
                "overall_assessment": "brief assessment"
            }}
            """

            messages = [
                {"role": "system", "content": "You are an expert document analyst. Provide precise relevance scoring for document sections based on user tasks."},
                {"role": "user", "content": prompt}
            ]

            # Get Gemini response
            response = self.llm_service(messages)
            
            # Try to parse JSON response
            import json
            try:
                analysis = json.loads(response.strip())
                return {
                    "relevance_score": float(analysis.get("relevance_score", 0.5)),
                    "reasoning": analysis.get("overall_assessment", "Gemini analysis completed"),
                    "key_reasons": analysis.get("key_reasons", []),
                    "matching_elements": analysis.get("matching_elements", []),
                    "enhanced": True
                }
            except json.JSONDecodeError:
                # Fallback: extract score from text response
                score = 0.5
                if "relevance_score" in response.lower():
                    import re
                    score_match = re.search(r'relevance_score.*?(\d\.\d+)', response.lower())
                    if score_match:
                        score = float(score_match.group(1))
                
                return {
                    "relevance_score": score,
                    "reasoning": response[:200] + "..." if len(response) > 200 else response,
                    "enhanced": True
                }
                
        except Exception as e:
            print(f"⚠️ Gemini analysis failed: {e}")
            return {"relevance_score": 0.0, "reasoning": f"LLM error: {str(e)}", "enhanced": False}

    def calculate_semantic_similarity_multi_context(self, section_text: str, job: str) -> float:
        """Compares section content with job description using multiple perspectives"""
        try:
            # Get different ways of looking at the job
            job_contexts = self.expand_job_context(job)
            
            # Convert everything to embeddings
            job_embeddings = self.semantic_model.encode(job_contexts, convert_to_tensor=True)
            section_embedding = self.semantic_model.encode(section_text[:512], convert_to_tensor=True)
            
            # See how similar the section is to each job context
            similarities = util.cos_sim(section_embedding, job_embeddings)[0]
            
            # Use the best match, but also consider the average
            best_match = torch.max(similarities).item()
            avg_match = torch.mean(similarities).item()
            
            # Combine them (70% best match, 30% average)
            final_score = 0.7 * best_match + 0.3 * avg_match
            
            return max(0.0, final_score)  # Make sure it's not negative
            
        except Exception as e:
            print(f"Error calculating semantic similarity: {e}")
            return 0.0

    def analyze_section_content_patterns(self, section_text: str, section_title: str) -> float:
        """Looks for patterns in the content that suggest it's useful information using pure logic"""
        text_lower = (section_text + " " + section_title).lower()
        
        score = 0.0
        
        # Pure logic: Bonus for structured content (lists, numbered items)
        # Check for bullet points, dashes, or numbered patterns
        structured_indicators = 0
        for char in ['•', '-', '*']:
            if char in section_text:
                structured_indicators += 1
        # Check for numbered patterns
        if any(f"{i}." in section_text for i in range(1, 10)):
            structured_indicators += 1
        if structured_indicators > 0:
            score += 0.15
        
        # Pure logic: Bonus for content with measurement symbols
        # Check for common measurement symbols
        symbol_count = sum(1 for char in section_text if char in ['%', '$', '°', '°C', '°F'])
        if symbol_count > 0:
            score += 0.1
        
        # Pure logic: Bonus for content with lots of numbers (suggests detailed info)
        numbers = sum(1 for char in section_text if char.isdigit())
        if numbers > 5:
            score += 0.1
        
        # Pure logic: Bonus for content with specific formatting (suggests structured data)
        if section_text.count('\n') > 5:  # Multiple lines suggest structured content
            score += 0.1
        
        return min(score, 0.5)  # Cap at 50% bonus

    def semantic_clustering_analysis(self, section_text: str, job: str) -> float:
        """Uses semantic clustering to understand contexts"""
        try:
            # Extract key phrases from the section using pure logic
            words = section_text.lower().split()
            key_phrases = []
            
            for i, word in enumerate(words):
                if len(word) > 3 and word.isalpha():
                    if i < len(words) - 1:
                        # Create 2-word phrases
                        phrase = f"{word} {words[i+1]}" if words[i+1].isalpha() else word
                        key_phrases.append(phrase)
                    else:
                        key_phrases.append(word)
            
            if not key_phrases:
                return 0.0
            
            # Limit to top 20 phrases for performance
            key_phrases = key_phrases[:20]
            
            # Convert phrases to embeddings
            phrase_embeddings = self.semantic_model.encode(key_phrases, convert_to_tensor=True)
            
            # Create job-related concept embeddings using the job itself
            job_words = job.lower().split()
            job_concepts = []
            
            # Create concept phrases from the job description using pure logic
            for i, word in enumerate(job_words):
                if len(word) > 3 and word.isalpha():
                    if i < len(job_words) - 1:
                        concept = f"{word} {job_words[i+1]}" if job_words[i+1].isalpha() else word
                        job_concepts.append(concept)
                    else:
                        job_concepts.append(word)
            
            # Also add the full job description
            job_concepts.append(job.lower())
            
            if not job_concepts:
                return 0.0
            
            # Convert job concepts to embeddings
            concept_embeddings = self.semantic_model.encode(job_concepts, convert_to_tensor=True)
            
            # Compare phrases with job concepts
            similarities = util.cos_sim(phrase_embeddings, concept_embeddings)
            
            # Find the best matches
            max_similarities = torch.max(similarities, dim=1)[0]
            
            # Calculate average of top matches
            top_similarities = torch.topk(max_similarities, min(5, len(max_similarities)))[0]
            avg_similarity = torch.mean(top_similarities).item()
            
            return avg_similarity * 0.3  # Scale down to reasonable bonus
            
        except Exception as e:
            print(f"Error in semantic clustering: {e}")
            return 0.0

    def semantic_reasoning_analysis(self, section_text: str, job: str) -> float:
        """Uses semantic reasoning"""
        try:
            # Convert job and section to embeddings
            job_embedding = self.semantic_model.encode(job, convert_to_tensor=True)
            section_embedding = self.semantic_model.encode(section_text[:512], convert_to_tensor=True)
            
            # Calculate direct similarity
            job_section_similarity = util.cos_sim(job_embedding, section_embedding).item()
            
            # Pure logic: Check for semantic contradictions using the model's understanding
            # Create contradiction patterns based on the job description itself
            contradiction_patterns = [
                f"not suitable for {job.lower()}",
                f"incompatible with {job.lower()}",
                f"does not meet {job.lower()} requirements",
                f"avoid {job.lower()}",
                f"not recommended for {job.lower()}"
            ]
            
            contradiction_embeddings = self.semantic_model.encode(contradiction_patterns, convert_to_tensor=True)
            contradiction_similarities = util.cos_sim(section_embedding, contradiction_embeddings)[0]
            max_contradiction_similarity = torch.max(contradiction_similarities).item()
            
            # Apply penalty if section contradicts the job
            contradiction_penalty = 0.0
            if max_contradiction_similarity > 0.5:  # Section contradicts job
                contradiction_penalty = 0.4
            
            # Final score: similarity minus penalties
            final_score = job_section_similarity - contradiction_penalty
            return max(0.0, final_score * 0.5)
            
        except Exception as e:
            print(f"Error in semantic reasoning: {e}")
            return 0.0

    def calculate_final_relevance_score(self, section: Dict, persona: str, job: str) -> float:
        """Combines all the analysis to give a final relevance score using Gemini LLM enhancement + semantic logic"""
        section_text = section.get('content', '')
        section_title = section.get('section_title', '')

        # 🚀 GEMINI LLM ENHANCED ANALYSIS
        gemini_analysis = self.gemini_enhanced_relevance_analysis(section_text, section_title, job, persona)
        
        if gemini_analysis["enhanced"]:
            print(f"   🤖 Gemini analysis: {gemini_analysis['relevance_score']:.3f} - {gemini_analysis['reasoning'][:50]}...")
            # Use Gemini as primary score with semantic analysis as validation
            gemini_score = gemini_analysis["relevance_score"]
            
            # Get semantic validation score
            base_score = self.calculate_semantic_similarity_multi_context(section_text, job)
            title_score = self.calculate_semantic_similarity_multi_context(section_title, job)
            semantic_validation = (base_score * 0.8) + (title_score * 0.2)
            
            # Combine Gemini with semantic validation (80% Gemini, 20% semantic)
            final_score = (gemini_score * 0.8) + (semantic_validation * 0.2)
            
            # Store Gemini insights in section
            section['gemini_analysis'] = {
                "relevance_score": gemini_score,
                "reasoning": gemini_analysis["reasoning"],
                "key_reasons": gemini_analysis.get("key_reasons", []),
                "matching_elements": gemini_analysis.get("matching_elements", [])
            }
            
            return min(max(final_score, 0.0), 1.0)
        
        else:
            print("   📊 Using fallback semantic analysis...")
            # FALLBACK: Original semantic analysis
            # Get the base semantic similarity (pure model-based relevance)
            base_score = self.calculate_semantic_similarity_multi_context(section_text, job)
            
            # Add semantic similarity for section title as well
            title_score = self.calculate_semantic_similarity_multi_context(section_title, job)
            
            # Combine text and title similarity (text is more important)
            combined_semantic_score = (base_score * 0.8) + (title_score * 0.2)
            
            # Add bonuses for content patterns
            content_bonus = self.analyze_section_content_patterns(section_text, section_title)
            
            # Add semantic clustering bonus
            clustering_bonus = self.semantic_clustering_analysis(section_text, job)
            
            # Add semantic reasoning bonus
            reasoning_bonus = self.semantic_reasoning_analysis(section_text, job)
            
            # Bonus for longer, more comprehensive sections
            length_bonus = min(0.1, len(section_text) / 10000)

            # Penalty for generic section titles
            # Pure logic: Penalty for generic titles (no hardcoded words)
            generic_penalty = 0.0
            words = section_title.split()
            if len(words) == 1 and len(section_title) < 15:
                generic_penalty = 0.5
            elif len(words) <= 2 and all(len(word) <= 2 for word in words):
                generic_penalty = 0.5

            # Pure logic: Bonus for descriptive titles (no hardcoded words)
            descriptive_bonus = 0.0
            if (section_title and 
                len(section_title.split()) >= 2 and 
                len(section_title.split()) <= 5 and 
                section_title[0].isupper() and
                len([word for word in section_title.split() if len(word) > 2]) >= 2):
                descriptive_bonus = 0.3

            # Combine everything with pure semantic logic as the primary factor
            final_score = (combined_semantic_score * 0.7 +  # 70% pure semantic similarity
                          content_bonus * 0.1 +  # 10% content patterns
                          clustering_bonus * 0.05 +  # 5% clustering
                          reasoning_bonus * 0.05 +  # 5% semantic reasoning
                          length_bonus -  # Length bonus
                          generic_penalty +  # Generic penalty
                          descriptive_bonus)  # Descriptive bonus
            
            return min(max(final_score, 0.0), 1.0)
    
    def rank_sections(self, sections: List[Dict], persona: str, job: str) -> List[Dict]:
        print(f"Ranking {len(sections)} sections using semantic understanding...")
        
        # Group sections by PDF for variety
        sections_by_pdf = {}
        for section in sections:
            pdf_name = os.path.basename(section['document'])
            if pdf_name not in sections_by_pdf:
                sections_by_pdf[pdf_name] = []
            sections_by_pdf[pdf_name].append(section)
        
        print(f"   Found sections from {len(sections_by_pdf)} PDFs")
        
        # Collect all sections for ranking
        all_sections = []
        for pdf_name, pdf_sections in sections_by_pdf.items():
            all_sections.extend(pdf_sections)
            print(f"   Taking {len(pdf_sections)} sections from {pdf_name}")
        
        print(f"   Processing all {len(all_sections)} sections for ranking")
        
        # Calculate scores for each section
        for i, section in enumerate(all_sections):
            if i % 10 == 0:
                print(f"   Processed {i}/{len(all_sections)} sections...")
            score = self.calculate_final_relevance_score(section, persona, job)
            section['relevance_score'] = score
        
        # Sort by score (highest first)
        ranked_sections = sorted(all_sections, key=lambda x: x['relevance_score'], reverse=True)
        
        # Add importance ranks
        for i, section in enumerate(ranked_sections, 1):
            section['importance_rank'] = i
        
        print(f"Ranking complete. Top score: {ranked_sections[0]['relevance_score']:.3f}")
        return ranked_sections

    def calculate_text_similarity_score(self, section: Dict[str, any], selected_text: str) -> float:
        """
        NEW METHOD: Calculate similarity between section content and selected text
        Uses Gemini for enhanced analysis with semantic fallback
        Input: section dict, selected text string
        Output: similarity score 0.0 to 1.0
        """
        try:
            # Get section content
            section_content = section.get('content', '')
            section_title = section.get('section_title', 'Untitled')
            
            if not section_content or not selected_text:
                return 0.0
            
            # Try Gemini enhanced analysis first
            if self.use_gemini_enhancement and self.llm_service:
                try:
                    gemini_result = self.gemini_text_similarity_analysis(
                        section_content, section_title, selected_text
                    )
                    
                    if gemini_result.get('enhanced', False):
                        # Store Gemini analysis in section for frontend use
                        section['gemini_analysis'] = gemini_result
                        return gemini_result.get('similarity_score', 0.0)
                        
                except Exception as e:
                    print(f"⚠️ Gemini text similarity failed: {e}")
            
            # Fallback to semantic similarity using sentence transformers
            return self.calculate_semantic_similarity(section_content, selected_text)
            
        except Exception as e:
            print(f"⚠️ Text similarity calculation failed: {e}")
            return 0.0

    def gemini_text_similarity_analysis(self, section_content: str, section_title: str, selected_text: str) -> Dict[str, any]:
        """
        Use Gemini to analyze text similarity with detailed reasoning
        """
        try:
            prompt = f"""
            Analyze the similarity between selected text and a document section:

            **Selected Text**: {selected_text[:500]}...
            
            **Section Title**: {section_title}
            **Section Content**: {section_content[:1000]}...

            Determine how similar/related these texts are. Consider:
            - Semantic similarity (same concepts, different words)
            - Topical overlap (same subject areas)
            - Contextual relevance (related themes, ideas)
            - Specific terminology or keywords in common

            Respond in exact JSON format:
            {{
                "similarity_score": 0.82,
                "reasoning": "Brief explanation of similarity",
                "key_connections": ["connection 1", "connection 2"],
                "shared_concepts": ["concept 1", "concept 2"]
            }}
            """

            response = self.llm_service(prompt)
            
            # Parse JSON response
            import json
            if '```json' in response:
                json_str = response.split('```json')[1].split('```')[0].strip()
            else:
                json_str = response.strip()
            
            result = json.loads(json_str)
            result['enhanced'] = True
            
            print(f"🤖 Gemini text similarity: {result.get('similarity_score', 0.0):.3f}")
            return result
            
        except Exception as e:
            print(f"⚠️ Gemini text similarity analysis failed: {e}")
            return {"similarity_score": 0.0, "enhanced": False, "reasoning": "Analysis failed"}

    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity using sentence transformers
        """
        try:
            if not text1 or not text2:
                return 0.0
            
            # Truncate texts to reasonable length
            text1 = text1[:2000]
            text2 = text2[:2000]
            
            # Generate embeddings
            embeddings1 = self.semantic_model.encode([text1], convert_to_tensor=True)
            embeddings2 = self.semantic_model.encode([text2], convert_to_tensor=True)
            
            # Calculate cosine similarity
            similarity = util.pytorch_cos_sim(embeddings1, embeddings2)[0][0].item()
            
            # Ensure score is between 0 and 1
            similarity = max(0.0, min(1.0, similarity))
            
            return similarity
            
        except Exception as e:
            print(f"⚠️ Semantic similarity calculation failed: {e}")
            return 0.0